<?php

namespace Tests\Feature;

use App\Models\DocumentReminder;
use App\Models\EmailTemplate;
use App\Models\OutboundDelivery;
use App\Support\EmailTemplateCatalog;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class DocumentDeliveryTrackingTest extends TestCase
{
    use CreatesTenant;
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();

        if ($this->app->make('db')->connection()->getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Requires PostgreSQL (native enums and row locks).');
        }

        $this->seedTenant();
    }

    public function test_register_seeds_default_email_templates(): void
    {
        $this->assertSame(
            count(EmailTemplateCatalog::defaults()),
            EmailTemplate::query()->where('organization_id', $this->organization->id)->count(),
        );

        $this->assertDatabaseHas('email_templates', [
            'organization_id' => $this->organization->id,
            'channel' => 'email',
            'event' => 'document_sent',
        ]);
    }

    public function test_issuing_an_invoice_schedules_cadence_reminders(): void
    {
        $id = $this->createAndIssueDocument()['id'];

        $reminders = DocumentReminder::query()
            ->where('document_id', $id)
            ->orderBy('milestone')
            ->get();

        $this->assertCount(4, $reminders);
        $this->assertEqualsCanonicalizing(
            ['J-3', 'J+3', 'J+7', 'J+14'],
            $reminders->pluck('milestone')->all(),
        );
        $this->assertTrue($reminders->every(fn (DocumentReminder $r) => $r->state === 'scheduled'));
        $this->assertSame('2026-09-17', $reminders->firstWhere('milestone', 'J-3')?->date);
        $this->assertSame('2026-09-23', $reminders->firstWhere('milestone', 'J+3')?->date);
        $this->assertNotNull($reminders->firstWhere('milestone', 'J-3')?->scheduled_for);
    }

    public function test_reissue_does_not_duplicate_reminders(): void
    {
        $id = $this->createAndIssueDocument()['id'];

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents/'.$id.'/issue')
            ->assertOk();

        $this->assertSame(4, DocumentReminder::query()->where('document_id', $id)->count());
    }

    public function test_free_plan_does_not_schedule_reminders(): void
    {
        $this->seedTenant('free');

        $id = $this->createAndIssueDocument()['id'];

        $this->assertSame(0, DocumentReminder::query()->where('document_id', $id)->count());
    }

    public function test_disabled_document_reminders_are_not_scheduled(): void
    {
        $id = $this->createAndIssueDocument(['reminders_enabled' => false])['id'];

        $this->assertSame(0, DocumentReminder::query()->where('document_id', $id)->count());
    }

    public function test_credit_note_does_not_schedule_reminders(): void
    {
        $id = $this->createAndIssueDocument(['kind' => 'credit_note'])['id'];

        $this->assertSame(0, DocumentReminder::query()->where('document_id', $id)->count());
    }

    public function test_email_template_update_accepts_legacy_milestone(): void
    {
        $this->withHeaders($this->tenantHeaders())
            ->putJson('/api/email-templates/J-3', [
                'subject' => 'Sujet test',
                'body' => 'Corps test',
            ])
            ->assertOk()
            ->assertJsonPath('event', 'reminder_J-3')
            ->assertJsonPath('milestone', 'J-3')
            ->assertJsonPath('subject', 'Sujet test');
    }

    public function test_outbound_delivery_can_be_recorded_for_a_document(): void
    {
        $id = $this->createAndIssueDocument()['id'];

        $delivery = OutboundDelivery::query()->create([
            'organization_id' => $this->organization->id,
            'document_id' => $id,
            'channel' => 'email',
            'event' => 'document_sent',
            'to_address' => $this->client->email,
            'subject' => 'Votre facture',
            'status' => 'sent',
            'payload_json' => ['client' => $this->client->name],
            'sent_at' => now(),
        ]);

        $reminder = DocumentReminder::query()
            ->where('document_id', $id)
            ->where('milestone', 'J+3')
            ->firstOrFail();

        $reminder->update(['outbound_delivery_id' => $delivery->id]);

        $this->assertDatabaseHas('outbound_deliveries', [
            'document_id' => $id,
            'event' => 'document_sent',
            'to_address' => $this->client->email,
            'status' => 'sent',
        ]);
        $this->assertSame($delivery->id, $reminder->fresh()->outbound_delivery_id);
    }
}

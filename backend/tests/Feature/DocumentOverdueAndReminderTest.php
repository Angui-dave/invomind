<?php

namespace Tests\Feature;

use App\Jobs\SendReminderJob;
use App\Mail\DocumentSentMail;
use App\Models\Document;
use App\Models\DocumentReminder;
use App\Services\DocumentPdfService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class DocumentOverdueAndReminderTest extends TestCase
{
    use CreatesTenant;
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();

        if ($this->app->make('db')->connection()->getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Requires PostgreSQL (native enums and row locks).');
        }

        Storage::fake('documents');
        Mail::fake();
        $this->seedTenant();
        $this->travelTo('2026-08-21 10:00:00');
    }

    public function test_sent_invoice_due_yesterday_becomes_overdue_idempotently(): void
    {
        $id = $this->createAndIssueDocument([
            'issue_date' => '2026-08-10',
            'due_date' => '2026-08-20',
        ])['id'];

        $this->assertSame('sent', Document::query()->findOrFail($id)->status);

        $this->artisan('documents:mark-overdue')->assertSuccessful();
        $this->assertSame('overdue', Document::query()->findOrFail($id)->status);

        $this->artisan('documents:mark-overdue')->assertSuccessful();
        $this->assertSame('overdue', Document::query()->findOrFail($id)->status);
    }

    public function test_draft_invoice_is_not_marked_overdue(): void
    {
        $id = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents', $this->documentPayload([
                'issue_date' => '2026-08-10',
                'due_date' => '2026-08-20',
            ]))
            ->json('id');

        $this->artisan('documents:mark-overdue')->assertSuccessful();

        $this->assertSame('draft', Document::query()->findOrFail($id)->status);
    }

    public function test_j_plus_3_reminder_sends_mail_and_records_delivery(): void
    {
        $id = $this->createAndIssueDocument()['id'];
        $this->app->make(DocumentPdfService::class)->render(Document::query()->findOrFail($id));
        $due = $this->armReminder($id, 'J+3');

        $this->artisan('documents:dispatch-reminders')->assertSuccessful();

        Mail::assertSent(DocumentSentMail::class, 1);
        Mail::assertSent(DocumentSentMail::class, function (DocumentSentMail $mail) {
            return $mail->hasTo($this->client->email)
                && str_contains($mail->envelope()->subject, 'Relance');
        });

        $this->assertSame('sent', $due->fresh()->state);
        $this->assertNotNull($due->fresh()->sent_at);
        $this->assertDatabaseHas('outbound_deliveries', [
            'document_id' => $id,
            'event' => 'reminder_J+3',
            'status' => 'sent',
            'to_address' => $this->client->email,
        ]);
    }

    public function test_due_reminder_is_not_dispatched_twice(): void
    {
        $id = $this->createAndIssueDocument()['id'];
        $due = $this->armReminder($id, 'J+3');

        Bus::fake([SendReminderJob::class]);

        $this->artisan('documents:dispatch-reminders')->assertSuccessful();
        $this->artisan('documents:dispatch-reminders')->assertSuccessful();

        Bus::assertDispatchedTimes(SendReminderJob::class, 1);
        Bus::assertDispatched(SendReminderJob::class, function (SendReminderJob $job) use ($due) {
            return $job->reminderId === $due->id
                && $job->uniqueId() === $this->organization->id.':reminder:'.$due->id;
        });
    }

    public function test_paid_invoice_skips_due_reminder_without_sending_mail(): void
    {
        $id = $this->createAndIssueDocument()['id'];
        $this->app->make(DocumentPdfService::class)->render(Document::query()->findOrFail($id));
        $due = $this->armReminder($id, 'J+3');

        Document::query()->whereKey($id)->update(['status' => 'paid']);

        SendReminderJob::dispatch($this->organization->id, $due->id);

        Mail::assertNothingSent();
        $this->assertSame('disabled', $due->fresh()->state);
        $this->assertDatabaseHas('outbound_deliveries', [
            'document_id' => $id,
            'event' => 'reminder_J+3',
            'status' => 'skipped',
        ]);
    }

    public function test_free_plan_skips_due_reminder_without_sending_mail(): void
    {
        $this->organization->update(['plan_id' => 'free']);

        $id = $this->createAndIssueDocument()['id'];
        $this->assertSame(0, DocumentReminder::query()->where('document_id', $id)->count());

        $reminder = DocumentReminder::query()->create([
            'organization_id' => $this->organization->id,
            'document_id' => $id,
            'milestone' => 'J+3',
            'state' => 'scheduled',
            'date' => now()->toDateString(),
            'scheduled_for' => now()->subMinute(),
        ]);

        $this->artisan('documents:dispatch-reminders')->assertSuccessful();

        Mail::assertNothingSent();
        $this->assertSame('disabled', $reminder->fresh()->state);
        $this->assertDatabaseHas('outbound_deliveries', [
            'document_id' => $id,
            'event' => 'reminder_J+3',
            'status' => 'skipped',
        ]);
    }

    public function test_payment_disables_remaining_scheduled_reminders(): void
    {
        $issued = $this->createAndIssueDocument();
        $id = $issued['id'];

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/payments', [
                'document_id' => $id,
                'amount' => $issued['total'],
                'currency' => 'XOF',
                'method' => 'transfer',
                'paid_at' => '2026-08-21',
            ])
            ->assertCreated();

        $this->assertSame('paid', Document::query()->findOrFail($id)->status);
        $this->assertTrue(
            DocumentReminder::query()
                ->where('document_id', $id)
                ->get()
                ->every(fn (DocumentReminder $reminder) => $reminder->state === 'disabled'),
        );
    }

    private function armReminder(string $documentId, string $milestone): DocumentReminder
    {
        DocumentReminder::query()
            ->where('document_id', $documentId)
            ->where('milestone', '!=', $milestone)
            ->update(['state' => 'disabled']);

        $reminder = DocumentReminder::query()
            ->where('document_id', $documentId)
            ->where('milestone', $milestone)
            ->firstOrFail();

        $reminder->update(['scheduled_for' => now()->subMinute()]);

        return $reminder->fresh();
    }
}

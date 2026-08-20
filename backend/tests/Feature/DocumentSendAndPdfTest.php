<?php

namespace Tests\Feature;

use App\Jobs\GenerateDocumentPdfJob;
use App\Jobs\SendDocumentMailJob;
use App\Mail\DocumentSentMail;
use App\Models\Document;
use App\Models\Membership;
use App\Models\Organization;
use App\Models\OrganizationBranding;
use App\Models\OrganizationSettings;
use App\Models\OutboundDelivery;
use App\Models\User;
use App\Services\DocumentPdfService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class DocumentSendAndPdfTest extends TestCase
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
    }

    public function test_send_without_client_email_returns_unprocessable(): void
    {
        $this->client->update(['email' => '']);

        $id = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents', $this->documentPayload())
            ->json('id');

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents/'.$id.'/send')
            ->assertStatus(422)
            ->assertJsonPath('message', 'Le client n’a pas d’adresse e-mail.');

        $this->assertSame('draft', Document::query()->findOrFail($id)->status);
        Mail::assertNothingSent();
    }

    public function test_send_draft_issues_renders_pdf_and_records_delivery(): void
    {
        $id = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents', $this->documentPayload())
            ->json('id');

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents/'.$id.'/send')
            ->assertOk()
            ->assertJsonPath('status', 'sent')
            ->assertJsonPath('frozen', true)
            ->assertJsonPath('number', 'FAC-2026-00001');

        Mail::assertSent(DocumentSentMail::class, function (DocumentSentMail $mail) {
            return $mail->hasTo($this->client->email)
                && str_contains($mail->envelope()->subject, 'FAC-2026-00001')
                && str_contains($mail->bodyText, $this->client->name);
        });

        $delivery = OutboundDelivery::query()->where('document_id', $id)->first();
        $this->assertNotNull($delivery);
        $this->assertSame('sent', $delivery->status);
        $this->assertSame('document_sent', $delivery->event);
        $this->assertSame($this->client->email, $delivery->to_address);

        $document = Document::query()->findOrFail($id);
        $this->assertNotNull($document->pdf_sha256);
        $this->assertTrue($document->pdf_ready);

        $this->withHeaders($this->tenantHeaders())
            ->get('/api/documents/'.$id.'/pdf')
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    }

    public function test_get_pdf_before_generation_returns_conflict(): void
    {
        Bus::fake([GenerateDocumentPdfJob::class]);

        $id = $this->createAndIssueDocument()['id'];

        $this->withHeaders($this->tenantHeaders())
            ->getJson('/api/documents/'.$id.'/pdf')
            ->assertStatus(409);
    }

    public function test_get_pdf_is_not_found_for_foreign_tenant(): void
    {
        $id = $this->createAndIssueDocument()['id'];
        $this->app->make(DocumentPdfService::class)->render(Document::query()->findOrFail($id));

        $stranger = User::query()->create([
            'name' => 'Stranger',
            'email' => 'stranger-'.Str::random(6).'@test.invomind',
            'password_hash' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);
        $otherOrg = Organization::query()->create([
            'name' => 'Autre',
            'slug' => 'autre-'.Str::random(6),
            'plan_id' => 'pro',
        ]);
        Membership::query()->create([
            'organization_id' => $otherOrg->id,
            'user_id' => $stranger->id,
            'role' => 'owner',
        ]);
        OrganizationSettings::query()->create([
            'organization_id' => $otherOrg->id,
            'company_name' => 'Autre',
            'email' => 'autre@test.invomind',
        ]);
        OrganizationBranding::query()->create([
            'organization_id' => $otherOrg->id,
        ]);

        Sanctum::actingAs($stranger);

        $this->withHeaders([
            'Accept' => 'application/json',
            'X-Organization-Id' => $otherOrg->id,
        ])
            ->getJson('/api/documents/'.$id.'/pdf')
            ->assertNotFound();
    }

    public function test_portal_pdf_streams_after_render(): void
    {
        $issued = $this->createAndIssueDocument();
        $document = Document::query()->findOrFail($issued['id']);
        $this->app->make(DocumentPdfService::class)->render($document);

        $this->get('/api/portal/'.$issued['portal_token'].'/pdf')
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    }

    public function test_send_job_can_be_dispatched(): void
    {
        Bus::fake([SendDocumentMailJob::class]);

        $id = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents', $this->documentPayload())
            ->json('id');

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents/'.$id.'/send')
            ->assertOk();

        Bus::assertDispatched(SendDocumentMailJob::class);
    }
}

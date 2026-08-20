<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Services\DocumentLifecycleService;
use App\Services\DocumentNumberingService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class DocumentLifecycleTest extends TestCase
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

    public function test_store_creates_a_draft_with_provisional_number(): void
    {
        $response = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents', $this->documentPayload());

        $response->assertCreated()
            ->assertJsonPath('status', 'draft')
            ->assertJsonPath('frozen', false)
            ->assertJsonPath('fiscal_year', null);

        $this->assertStringStartsWith('BROUILLON-FAC-', $response->json('number'));
        $this->assertDatabaseCount('document_sequences', 0);
    }

    public function test_issue_assigns_annual_number_freezes_and_snapshots(): void
    {
        $draft = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents', $this->documentPayload())
            ->json();

        $response = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents/'.$draft['id'].'/issue');

        $response->assertOk()
            ->assertJsonPath('status', 'sent')
            ->assertJsonPath('frozen', true)
            ->assertJsonPath('number', 'FAC-2026-00001')
            ->assertJsonPath('fiscal_year', 2026);

        $this->assertNotNull($response->json('issued_at'));
        $this->assertSame($this->user->id, $response->json('issued_by_user_id'));

        $stored = Document::query()->findOrFail($draft['id']);
        $this->assertSame('FAC-2026-00001', $stored->snapshot_json['document']['number'] ?? null);
        $this->assertSame('Atelier Diallo', $stored->snapshot_json['organization']['name'] ?? null);
        $this->assertCount(1, $stored->snapshot_json['lines'] ?? []);
    }

    public function test_reissue_does_not_change_the_number(): void
    {
        $draft = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents', $this->documentPayload())
            ->json();

        $first = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents/'.$draft['id'].'/issue')
            ->json('number');

        $second = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents/'.$draft['id'].'/issue')
            ->assertOk()
            ->json('number');

        $this->assertSame($first, $second);
        $this->assertSame('FAC-2026-00001', $second);
        $this->assertDatabaseHas('document_sequences', [
            'organization_id' => $this->organization->id,
            'kind' => 'invoice',
            'year' => 2026,
            'last_number' => 1,
        ]);
    }

    public function test_update_on_frozen_document_returns_conflict(): void
    {
        $draft = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents', $this->documentPayload())
            ->json();

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents/'.$draft['id'].'/issue')
            ->assertOk();

        $this->withHeaders($this->tenantHeaders())
            ->putJson('/api/documents/'.$draft['id'], $this->documentPayload([
                'notes' => 'tentative de modification',
            ]))
            ->assertStatus(409)
            ->assertJsonPath('message', 'Ce document est émis et ne peut plus être modifié.');

        $this->assertDatabaseHas('documents', [
            'id' => $draft['id'],
            'notes' => null,
            'frozen' => true,
        ]);
    }

    public function test_store_ignores_sent_status_and_stays_draft(): void
    {
        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents', $this->documentPayload(['status' => 'sent']))
            ->assertCreated()
            ->assertJsonPath('status', 'draft')
            ->assertJsonPath('frozen', false);
    }

    public function test_two_issues_get_distinct_sequential_numbers(): void
    {
        $first = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents', $this->documentPayload())
            ->json('id');
        $second = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents', $this->documentPayload())
            ->json('id');

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents/'.$first.'/issue')
            ->assertJsonPath('number', 'FAC-2026-00001');

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents/'.$second.'/issue')
            ->assertJsonPath('number', 'FAC-2026-00002');
    }

    public function test_deleted_draft_does_not_consume_sequence(): void
    {
        $draft = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents', $this->documentPayload())
            ->json();

        Document::query()->where('id', $draft['id'])->delete();

        $other = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents', $this->documentPayload())
            ->json('id');

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents/'.$other.'/issue')
            ->assertJsonPath('number', 'FAC-2026-00001');
    }

    public function test_rolled_back_allocation_does_not_leave_a_gap(): void
    {
        $numbering = $this->app->make(DocumentNumberingService::class);

        try {
            DB::transaction(function () use ($numbering) {
                $numbering->allocate($this->organization->id, 'invoice', 2026);
                throw new \RuntimeException('force rollback');
            });
        } catch (\RuntimeException $e) {
            $this->assertSame('force rollback', $e->getMessage());
        }

        $allocated = DB::transaction(
            fn () => $numbering->allocate($this->organization->id, 'invoice', 2026),
        );

        $this->assertSame('FAC-2026-00001', $allocated);
    }

    public function test_credit_note_issues_as_issued(): void
    {
        $draft = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents', $this->documentPayload([
                'kind' => 'credit_note',
            ]))
            ->json();

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents/'.$draft['id'].'/issue')
            ->assertOk()
            ->assertJsonPath('status', 'issued')
            ->assertJsonPath('number', 'AV-2026-00001');
    }

    public function test_lifecycle_issue_is_idempotent_on_frozen_document(): void
    {
        $id = $this->createAndIssueDocument()['id'];

        $document = Document::query()->findOrFail($id);
        $issued = $this->app->make(DocumentLifecycleService::class)->issue($document, $this->user);

        $this->assertSame('FAC-2026-00001', $issued->number);
        $this->assertTrue($issued->frozen);
    }

    public function test_invoice_can_be_cancelled(): void
    {
        $id = $this->createAndIssueDocument()['id'];

        $this->withHeaders($this->tenantHeaders())
            ->putJson('/api/documents/'.$id.'/status', ['status' => 'cancelled'])
            ->assertOk()
            ->assertJsonPath('status', 'cancelled');
    }

    public function test_credit_note_can_be_applied(): void
    {
        $invoiceId = $this->createAndIssueDocument()['id'];

        $draft = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents', $this->documentPayload([
                'kind' => 'credit_note',
                'source_document_id' => $invoiceId,
            ]))
            ->assertCreated()
            ->json();

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents/'.$draft['id'].'/issue')
            ->assertOk()
            ->assertJsonPath('status', 'issued');

        $this->withHeaders($this->tenantHeaders())
            ->putJson('/api/documents/'.$draft['id'].'/status', ['status' => 'applied'])
            ->assertOk()
            ->assertJsonPath('status', 'applied');
    }

    public function test_clients_pagination_envelope(): void
    {
        $this->withHeaders($this->tenantHeaders())
            ->getJson('/api/clients?per_page=1&page=1')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta' => ['current_page', 'last_page', 'per_page', 'total']]);
    }
}

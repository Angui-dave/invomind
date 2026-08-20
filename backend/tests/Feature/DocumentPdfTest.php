<?php

namespace Tests\Feature;

use App\Jobs\GenerateDocumentPdfJob;
use App\Models\Document;
use App\Models\Payment;
use App\Services\DocumentComputeService;
use App\Services\DocumentPdfService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class DocumentPdfTest extends TestCase
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
        $this->seedTenant();
        $this->organization->settings()->update([
            'phone' => '+221338001122',
            'address' => '12 rue Sandaga',
            'city' => 'Dakar',
            'legal_mentions' => 'SARL au capital de 1 000 000 XOF',
            'mobile_money_provider' => 'wave',
            'mobile_money_number' => '+221771234567',
        ]);
        $this->client->update([
            'tax_id' => 'SN998877',
            'address' => 'Almadies',
            'city' => 'Dakar',
        ]);
    }

    public function test_issue_dispatches_generate_document_pdf_job(): void
    {
        Bus::fake([GenerateDocumentPdfJob::class]);

        $id = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents', $this->mixedRateInvoicePayload())
            ->json('id');

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents/'.$id.'/issue')
            ->assertOk();

        Bus::assertDispatched(GenerateDocumentPdfJob::class, function (GenerateDocumentPdfJob $job) use ($id) {
            return $job->organizationId === $this->organization->id
                && $job->documentId === $id
                && $job->tries === 3
                && $job->uniqueId() === $this->organization->id.':'.$id;
        });
    }

    public function test_invoice_html_and_pdf_match_compute_and_include_ninea(): void
    {
        $document = $this->issueKind('invoice', $this->mixedRateInvoicePayload()['lines']);
        $computed = $this->app->make(DocumentComputeService::class)->compute(
            $document->snapshot_json['lines'],
            'exclusive',
        );

        $html = $this->app->make(DocumentPdfService::class)->html($document);

        $this->assertStringContainsString('Facture', $html);
        $this->assertStringContainsString('NINEA / n° fiscal', $html);
        $this->assertStringContainsString('SN123456', $html);
        $this->assertStringContainsString('NINEA client', $html);
        $this->assertStringContainsString('SN998877', $html);
        $this->assertStringContainsString('Couture sur mesure', $html);
        $this->assertStringContainsString('Livraison exonérée', $html);
        $this->assertStringContainsString('TVA 18 %', $html);
        $this->assertStringContainsString('TVA 0 %', $html);
        $this->assertStringContainsString('/f/'.$document->portal_token, $html);
        $this->assertStringContainsString('Wave', $html);

        $path = $this->app->make(DocumentPdfService::class)->render($document);
        $bytes = Storage::disk('documents')->get($path);

        $this->assertSame($computed['subtotal_ht'], $document->snapshot_json['document']['subtotal_ht']);
        $this->assertSame($computed['tax_total'], $document->snapshot_json['document']['tax_total']);
        $this->assertSame($computed['total'], $document->snapshot_json['document']['total']);
        $this->assertSame('150000.00', $computed['subtotal_ht']);
        $this->assertSame('18000.00', $computed['tax_total']);
        $this->assertSame('168000.00', $computed['total']);
        $this->assertStringStartsWith('%PDF', $bytes);
        $this->assertGreaterThan(2000, strlen($bytes));
        $this->assertNotNull($document->fresh()->pdf_sha256);
        $this->assertSame(64, strlen($document->fresh()->pdf_sha256));
        $this->assertTrue(Storage::disk('documents')->exists($document->fresh()->pdf_disk_path));
    }

    public function test_pdf_generation_is_idempotent_when_snapshot_is_unchanged(): void
    {
        $document = $this->issueKind('invoice', $this->mixedRateInvoicePayload()['lines']);
        $service = $this->app->make(DocumentPdfService::class);

        $first = $service->render($document);
        $hash = $document->fresh()->pdf_sha256;

        $second = $service->render($document->fresh());

        $this->assertSame($first, $second);
        $this->assertSame($hash, $document->fresh()->pdf_sha256);
        $this->assertCount(1, collect(Storage::disk('documents')->allFiles())->filter(
            fn (string $file) => str_ends_with($file, '.pdf'),
        ));
    }

    public function test_credit_note_pdf_is_titled_avoir(): void
    {
        $document = $this->issueKind('credit_note', [
            ['description' => 'Retour tissu', 'quantity' => 1, 'unit_price' => 20000, 'tax_rate' => 18],
        ]);

        $html = $this->app->make(DocumentPdfService::class)->html($document);

        $this->assertStringContainsString('Avoir', $html);
        $this->assertStringContainsString('Montant crédité TTC', $html);
        $this->assertStringContainsString('montant à déduire', $html);
        $this->assertStringNotContainsString('Payer cette facture', $html);

        $bytes = Storage::disk('documents')->get(
            $this->app->make(DocumentPdfService::class)->render($document),
        );
        $this->assertStringStartsWith('%PDF', $bytes);
    }

    public function test_quote_pdf_is_not_an_invoice(): void
    {
        $document = $this->issueKind('quote', [
            ['description' => 'Étude', 'quantity' => 1, 'unit_price' => 75000, 'tax_rate' => 18],
        ]);

        $html = $this->app->make(DocumentPdfService::class)->html($document);

        $this->assertStringContainsString('Devis', $html);
        $this->assertStringContainsString('n’est pas une facture', $html);
        $this->assertStringNotContainsString('Échéance', $html);
        $this->assertStringNotContainsString('Payer cette facture', $html);

        $bytes = Storage::disk('documents')->get(
            $this->app->make(DocumentPdfService::class)->render($document),
        );
        $this->assertStringStartsWith('%PDF', $bytes);
    }

    public function test_receipt_template_renders_a_pdf(): void
    {
        $document = $this->issueKind('invoice', $this->mixedRateInvoicePayload()['lines']);
        $this->app->make(DocumentPdfService::class)->render($document);

        $payment = Payment::query()->create([
            'organization_id' => $this->organization->id,
            'document_id' => $document->id,
            'document_number' => $document->number,
            'client_id' => $this->client->id,
            'client_name' => $this->client->name,
            'amount' => $document->total,
            'currency' => 'XOF',
            'method' => 'mobile_money',
            'paid_at' => '2026-08-20',
            'reference' => 'WAVE-1',
            'source' => Payment::SOURCE_MANUAL,
        ]);

        $path = $this->app->make(DocumentPdfService::class)->renderReceipt($payment);
        $bytes = Storage::disk('documents')->get($path);

        $this->assertStringStartsWith('%PDF', $bytes);
        $this->assertStringContainsString('receipts', $path);
    }

    /**
     * @param  array<int, array<string, mixed>>  $lines
     */
    private function issueKind(string $kind, array $lines): Document
    {
        $id = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents', $this->documentPayload([
                'kind' => $kind,
                'lines' => $lines,
            ]))
            ->json('id');

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents/'.$id.'/issue')
            ->assertOk();

        return Document::query()->findOrFail($id);
    }

    /**
     * @return array<string, mixed>
     */
    private function mixedRateInvoicePayload(): array
    {
        return $this->documentPayload([
            'lines' => [
                [
                    'description' => 'Couture sur mesure',
                    'quantity' => 1,
                    'unit_price' => 100000,
                    'tax_rate' => 18,
                ],
                [
                    'description' => 'Livraison exonérée',
                    'quantity' => 1,
                    'unit_price' => 50000,
                    'tax_rate' => 0,
                ],
            ],
        ]);
    }
}

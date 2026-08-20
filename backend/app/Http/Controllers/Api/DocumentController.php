<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\DocumentFrozenException;
use App\Http\Controllers\Controller;
use App\Http\Requests\DocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Jobs\SendDocumentMailJob;
use App\Models\Client;
use App\Models\Document;
use App\Models\DocumentLine;
use App\Services\DocumentComputeService;
use App\Services\DocumentLifecycleService;
use App\Services\DocumentNumberingService;
use App\Services\DocumentPdfService;
use App\Services\EntitlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DocumentController extends Controller
{
    public function __construct(
        private DocumentComputeService $compute,
        private DocumentNumberingService $numbering,
        private DocumentLifecycleService $lifecycle,
        private DocumentPdfService $pdfs,
        private EntitlementService $entitlements,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Document::where('organization_id', $this->orgId($request))
            ->with(['lines', 'reminders'])
            ->orderBy('created_at', 'desc');

        if ($kind = $request->query('kind')) {
            $query->where('kind', $kind);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return DocumentResource::collection($query->get());
    }

    public function show(Request $request, string $id): DocumentResource
    {
        $doc = Document::where('organization_id', $this->orgId($request))
            ->with(['lines', 'reminders', 'payments'])
            ->findOrFail($id);

        return new DocumentResource($doc);
    }

    public function store(DocumentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $orgId = $this->orgId($request);

        if ($data['kind'] === 'invoice') {
            $this->entitlements->assertCanCreateInvoice($orgId);
        }

        return DB::transaction(function () use ($data, $orgId) {
            $client = Client::where('organization_id', $orgId)->findOrFail($data['client_id']);
            $totals = $this->compute->compute($data['lines'], $data['tax_mode'] ?? 'exclusive');

            $doc = Document::create([
                'organization_id' => $orgId,
                'kind' => $data['kind'],
                'number' => $this->numbering->provisional($data['kind']),
                'client_id' => $client->id,
                'client_name' => $client->name,
                'status' => 'draft',
                'currency' => $data['currency'] ?? 'XOF',
                'tax_mode' => $data['tax_mode'] ?? 'exclusive',
                'issue_date' => $data['issue_date'],
                'due_date' => $data['due_date'],
                'total' => $totals['total'],
                'subtotal_ht' => $totals['subtotal_ht'],
                'tax_total' => $totals['tax_total'],
                'online_payment_enabled' => $data['online_payment_enabled'] ?? false,
                'reminders_enabled' => $data['reminders_enabled'] ?? true,
                'portal_token' => Str::random(32),
                'source_document_id' => $data['source_document_id'] ?? null,
                'notes' => $data['notes'] ?? null,
                'frozen' => false,
            ]);

            $this->syncLines($doc, $data['lines']);

            return (new DocumentResource($doc->load(['lines', 'reminders'])))
                ->response()
                ->setStatusCode(201);
        });
    }

    public function update(DocumentRequest $request, string $id): DocumentResource|JsonResponse
    {
        $data = $request->validated();
        $orgId = $this->orgId($request);

        return DB::transaction(function () use ($data, $orgId, $id) {
            $doc = Document::where('organization_id', $orgId)->findOrFail($id);

            if ($doc->frozen) {
                throw new DocumentFrozenException;
            }

            $this->authorize('update', $doc);

            $client = Client::where('organization_id', $orgId)->findOrFail($data['client_id']);
            $totals = $this->compute->compute($data['lines'], $data['tax_mode'] ?? 'exclusive');

            $doc->update([
                'client_id' => $client->id,
                'client_name' => $client->name,
                'currency' => $data['currency'] ?? $doc->currency,
                'tax_mode' => $data['tax_mode'] ?? $doc->tax_mode,
                'issue_date' => $data['issue_date'],
                'due_date' => $data['due_date'],
                'total' => $totals['total'],
                'subtotal_ht' => $totals['subtotal_ht'],
                'tax_total' => $totals['tax_total'],
                'online_payment_enabled' => $data['online_payment_enabled'] ?? $doc->online_payment_enabled,
                'reminders_enabled' => $data['reminders_enabled'] ?? $doc->reminders_enabled,
                'source_document_id' => $data['source_document_id'] ?? $doc->source_document_id,
                'notes' => $data['notes'] ?? null,
            ]);

            DocumentLine::where('document_id', $doc->id)->delete();
            $this->syncLines($doc, $data['lines']);

            return new DocumentResource($doc->load(['lines', 'reminders']));
        });
    }

    public function issue(Request $request, string $id): DocumentResource
    {
        $doc = Document::where('organization_id', $this->orgId($request))->findOrFail($id);

        $this->authorize('issue', $doc);

        $issued = $this->lifecycle->issue($doc, $request->user());

        return new DocumentResource($issued->load(['lines', 'reminders']));
    }

    public function send(Request $request, string $id): DocumentResource
    {
        $doc = Document::where('organization_id', $this->orgId($request))
            ->with('client')
            ->findOrFail($id);

        $this->authorize('send', $doc);

        $email = $doc->client?->email;
        if (! filled($email)) {
            throw new HttpException(422, 'Le client n’a pas d’adresse e-mail.');
        }

        if ($doc->status === 'cancelled') {
            throw new HttpException(422, 'Ce document ne peut pas être envoyé.');
        }

        if (! $doc->frozen) {
            $doc = $this->lifecycle->issue($doc, $request->user());
        }

        SendDocumentMailJob::dispatch($doc->organization_id, $doc->id);

        return new DocumentResource($doc->fresh(['lines', 'reminders', 'client']));
    }

    /**
     * Transition a sent quote to accepted / refused / expired.
     */
    public function updateStatus(Request $request, string $id): DocumentResource
    {
        $data = $request->validate([
            'status' => ['required', 'in:accepted,refused,expired'],
        ]);

        $doc = Document::where('organization_id', $this->orgId($request))->findOrFail($id);

        $this->authorize('updateStatus', $doc);

        if ($doc->kind !== 'quote') {
            throw new HttpException(422, 'Seuls les devis acceptent cette transition.');
        }

        if (! in_array($doc->status, ['sent', 'accepted', 'refused', 'expired'], true)) {
            throw new HttpException(422, 'Le devis doit être émis avant de changer de statut.');
        }

        $doc->update(['status' => $data['status']]);

        return new DocumentResource($doc->fresh(['lines', 'reminders']));
    }

    public function pdf(Request $request, string $id): Response
    {
        $doc = Document::where('organization_id', $this->orgId($request))->findOrFail($id);

        $this->authorize('view', $doc);

        return $this->pdfs->stream($doc);
    }

    /**
     * @param  array<int, array<string, mixed>>  $lines
     */
    private function syncLines(Document $doc, array $lines): void
    {
        foreach ($lines as $i => $line) {
            DocumentLine::create([
                'organization_id' => $doc->organization_id,
                'document_id' => $doc->id,
                'description' => $line['description'],
                'quantity' => $line['quantity'],
                'unit_price' => $line['unit_price'],
                'tax_rate' => $line['tax_rate'] ?? 0,
                'discount_percent' => $line['discount_percent'] ?? null,
                'catalog_item_id' => $line['catalog_item_id'] ?? null,
                'position' => $i,
            ]);
        }
    }
}

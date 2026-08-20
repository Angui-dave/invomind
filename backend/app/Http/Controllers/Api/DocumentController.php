<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DocumentRequest;
use App\Models\Client;
use App\Models\Document;
use App\Models\DocumentLine;
use App\Models\DocumentReminder;
use App\Services\DocumentComputeService;
use App\Services\EntitlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    public function __construct(
        private DocumentComputeService $compute,
        private EntitlementService $entitlements,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Document::where('organization_id', $this->orgId($request))
            ->with('lines')
            ->orderBy('created_at', 'desc');

        if ($kind = $request->query('kind')) {
            $query->where('kind', $kind);
        }

        return response()->json($query->get());
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $doc = Document::where('organization_id', $this->orgId($request))
            ->with(['lines', 'reminders', 'payments'])
            ->findOrFail($id);

        return response()->json($doc);
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

            $docNumber = $this->generateNumber($orgId, $data['kind']);

            $doc = Document::create([
                'organization_id' => $orgId,
                'kind' => $data['kind'],
                'number' => $docNumber,
                'client_id' => $client->id,
                'client_name' => $client->name,
                'status' => $data['status'],
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
            ]);

            foreach ($data['lines'] as $i => $line) {
                DocumentLine::create([
                    'organization_id' => $orgId,
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

            return response()->json($doc->load('lines'), 201);
        });
    }

    public function update(DocumentRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();
        $orgId = $this->orgId($request);

        return DB::transaction(function () use ($data, $orgId, $id) {
            $doc = Document::where('organization_id', $orgId)->findOrFail($id);
            $client = Client::where('organization_id', $orgId)->findOrFail($data['client_id']);
            $totals = $this->compute->compute($data['lines'], $data['tax_mode'] ?? 'exclusive');

            $doc->update([
                'client_id' => $client->id,
                'client_name' => $client->name,
                'status' => $data['status'],
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
                'notes' => $data['notes'] ?? $doc->notes,
            ]);

            DocumentLine::where('document_id', $doc->id)->delete();

            foreach ($data['lines'] as $i => $line) {
                DocumentLine::create([
                    'organization_id' => $orgId,
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

            return response()->json($doc->load('lines'));
        });
    }

    private function generateNumber(string $orgId, string $kind): string
    {
        $prefix = match ($kind) {
            'quote' => 'DEV',
            'invoice' => 'FAC',
            'credit_note' => 'AV',
            default => 'DOC',
        };

        $count = Document::where('organization_id', $orgId)->where('kind', $kind)->count();

        return $prefix . '-' . str_pad($count + 1, 5, '0', STR_PAD_LEFT);
    }
}

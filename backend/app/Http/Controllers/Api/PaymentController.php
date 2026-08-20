<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentRequest;
use App\Models\Client;
use App\Models\Document;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $payments = Payment::where('organization_id', $this->orgId($request))
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($payments);
    }

    public function store(PaymentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $orgId = $this->orgId($request);

        $doc = Document::where('organization_id', $orgId)->findOrFail($data['document_id']);
        $client = Client::where('organization_id', $orgId)->findOrFail($doc->client_id);

        $payment = Payment::create([
            ...$data,
            'organization_id' => $orgId,
            'document_number' => $doc->number,
            'client_id' => $client->id,
            'client_name' => $client->name,
            'currency' => $data['currency'] ?? $doc->currency,
        ]);

        $this->updateDocumentStatus($doc);

        return response()->json($payment, 201);
    }

    private function updateDocumentStatus(Document $doc): void
    {
        $totalPaid = Payment::where('document_id', $doc->id)->sum('amount');

        if (bccomp((string) $totalPaid, (string) $doc->total, 2) >= 0) {
            $doc->update(['status' => 'paid']);
        } elseif (bccomp((string) $totalPaid, '0', 2) > 0) {
            $doc->update(['status' => 'partially_paid']);
        }
    }
}

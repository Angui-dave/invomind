<?php

namespace App\Http\Controllers\Api;

use App\Enums\ModePaiement;
use App\Http\Controllers\Controller;
use App\Http\Resources\InvoicePaymentResource;
use App\Models\Invoice;
use App\Models\InvoicePayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        $query = InvoicePayment::query()
            ->with(['invoice:id,numero', 'client:id,name_company'])
            ->orderByDesc('date_paiement');

        if ($request->filled('facture_id')) {
            $query->where('facture_id', $request->query('facture_id'));
        }

        return $this->paginated($request, $query, InvoicePaymentResource::class);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'facture_id' => ['required', 'integer', 'exists:factures,id'],
            'montant' => ['required', 'numeric', 'gt:0'],
            'devise' => ['nullable', 'string', 'size:3'],
            'date_paiement' => ['nullable', 'date'],
            'mode_paiement' => ['required', Rule::enum(ModePaiement::class)],
            'reference' => ['nullable', 'string', 'max:100'],
            'note' => ['nullable', 'string'],
        ]);

        $invoice = Invoice::query()->findOrFail($data['facture_id']);

        $payment = InvoicePayment::create([
            'orga_id' => $this->orgId($request),
            'facture_id' => $invoice->id,
            'client_id' => $invoice->client_id,
            'montant' => $data['montant'],
            'devise' => $data['devise'] ?? $invoice->devise ?? 'XOF',
            'date_paiement' => $data['date_paiement'] ?? now(),
            'mode_paiement' => $data['mode_paiement'],
            'reference' => $data['reference'] ?? null,
            'note' => $data['note'] ?? null,
        ]);

        $payment->load(['invoice:id,numero', 'client:id,name_company']);

        return (new InvoicePaymentResource($payment))
            ->response()
            ->setStatusCode(201);
    }
}

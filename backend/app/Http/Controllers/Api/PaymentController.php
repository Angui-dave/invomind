<?php

namespace App\Http\Controllers\Api;

use App\Enums\FactureStatut;
use App\Enums\ModePaiement;
use App\Http\Controllers\Controller;
use App\Http\Resources\InvoicePaymentResource;
use App\Models\Invoice;
use App\Models\InvoicePayment;
use App\Support\OrgRules;
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
            'facture_id' => ['required', 'integer', OrgRules::exists('factures')],
            'montant' => ['required', 'numeric', 'gt:0'],
            'devise' => ['nullable', 'string', 'size:3'],
            'date_paiement' => ['nullable', 'date'],
            'mode_paiement' => ['required', Rule::enum(ModePaiement::class)],
            'reference' => ['nullable', 'string', 'max:100'],
            'note' => ['nullable', 'string'],
        ]);

        $invoice = Invoice::query()->findOrFail($data['facture_id']);
        $status = $invoice->statut instanceof FactureStatut
            ? $invoice->statut
            : FactureStatut::tryFrom((string) $invoice->statut);

        if ($status === FactureStatut::Brouillon || $status === FactureStatut::Annulee) {
            abort(422, 'Cette facture n’accepte pas de paiement.');
        }

        $balance = max(0, round((float) $invoice->montant_total - (float) $invoice->montant_paye, 2));
        if ((float) $data['montant'] > $balance + 0.009) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'montant' => 'Le paiement dépasse le solde restant ('.$balance.').',
            ]);
        }

        $devise = $data['devise'] ?? $invoice->devise ?? 'XOF';
        if ($devise !== ($invoice->devise ?? 'XOF')) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'devise' => 'La devise du paiement doit correspondre à celle de la facture.',
            ]);
        }

        $payment = InvoicePayment::create([
            'orga_id' => $this->orgId($request),
            'facture_id' => $invoice->id,
            'client_id' => $invoice->client_id,
            'montant' => $data['montant'],
            'devise' => $devise,
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

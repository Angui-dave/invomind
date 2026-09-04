<?php

namespace App\Http\Controllers\Api;

use App\Enums\CinetPayStatut;
use App\Enums\ModePaiement;
use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\CinetPayPayment;
use App\Models\Invoice;
use App\Models\PaymentIntegration;
use App\Services\EntitlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PortalController extends Controller
{
    public function show(string $token): InvoiceResource|JsonResponse
    {
        $invoice = Invoice::query()
            ->withoutGlobalScopes()
            ->with('lines')
            ->where('uuid', $token)
            ->firstOrFail();

        return new InvoiceResource($invoice);
    }

    public function pdf(string $token): JsonResponse
    {
        return response()->json(['message' => 'PDF portal non reconnecté.'], 501);
    }

    public function receipt(string $token): JsonResponse
    {
        return response()->json(['message' => 'Reçu PDF non reconnecté.'], 501);
    }

    public function pay(Request $request, string $token): JsonResponse
    {
        return response()->json(['message' => 'Utilisez POST /portal/{uuid}/checkout.'], 410);
    }

    public function checkout(Request $request, string $token, EntitlementService $entitlements): JsonResponse
    {
        $invoice = Invoice::query()
            ->withoutGlobalScopes()
            ->where('uuid', $token)
            ->firstOrFail();

        $entitlements->assertOnlinePayments($invoice->orga_id);

        $integration = PaymentIntegration::query()
            ->withoutGlobalScopes()
            ->where('orga_id', $invoice->orga_id)
            ->where('fournisseur', 'cinetpay')
            ->where('actif', true)
            ->first();

        if (! $integration) {
            return response()->json(['message' => 'Intégration CinetPay non configurée.'], 422);
        }

        $data = $request->validate([
            'numero_telephone' => ['nullable', 'string', 'max:20'],
            'operateur' => ['nullable', 'string'],
            'montant' => ['nullable', 'numeric', 'gt:0'],
        ]);

        $remaining = (float) $invoice->montant_total - (float) $invoice->montant_paye;
        $montant = (float) ($data['montant'] ?? $remaining);

        if ($montant <= 0) {
            return response()->json(['message' => 'Facture déjà soldée.'], 422);
        }

        $payment = CinetPayPayment::withoutGlobalScopes()->create([
            'orga_id' => $invoice->orga_id,
            'facture_id' => $invoice->id,
            'transaction_id' => 'inv_'.Str::uuid()->toString(),
            'montant' => $montant,
            'devise' => $invoice->devise ?? 'XOF',
            'operateur' => $data['operateur'] ?? ModePaiement::Autre,
            'numero_telephone' => $data['numero_telephone'] ?? null,
            'statut' => CinetPayStatut::Initiee,
            'date_initiation' => now(),
        ]);

        return response()->json([
            'transaction_id' => $payment->transaction_id,
            'montant' => $payment->montant,
            'message' => 'Paiement initié — brancher l’appel CinetPay Gateway.',
            'payment' => $payment,
        ], 201);
    }
}

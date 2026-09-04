<?php

namespace App\Http\Controllers\Api\Webhooks;

use App\Enums\CinetPayStatut;
use App\Http\Controllers\Controller;
use App\Models\CinetPayPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CinetPayWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        if ($request->isMethod('get')) {
            if (! in_array((string) config('app.env'), ['local', 'testing'], true)) {
                return response()->json(['message' => 'Method Not Allowed'], 405);
            }

            return response()->json(['status' => 'ok']);
        }

        $transactionId = (string) (
            $request->input('cpm_trans_id')
            ?? $request->input('transaction_id')
            ?? $request->input('provider_transaction_id')
            ?? ''
        );

        if ($transactionId === '') {
            return response()->json(['message' => 'Transaction id manquant'], 400);
        }

        $payment = CinetPayPayment::withoutGlobalScopes()
            ->where('transaction_id', $transactionId)
            ->first();

        if (! $payment) {
            return response()->json(['message' => 'Paiement inconnu'], 404);
        }

        // IMPORTANT: production must call CinetPay GET /v2/payment/check before marking succes.
        // Trigger reconcilier_paiement_cinetpay will create paiements_facture on status change.
        if ($payment->statut !== CinetPayStatut::Succes) {
            $payment->update([
                'statut' => CinetPayStatut::Succes,
                'code_retour' => (string) ($request->input('cpm_result') ?? '00'),
                'message_retour' => (string) ($request->input('cpm_error_message') ?? 'OK'),
                'payload_notification' => $request->all(),
                'date_confirmation' => now(),
                'cinetpay_payment_id' => $request->input('cpm_payid'),
            ]);
        }

        return response()->json(['status' => 'ok']);
    }
}

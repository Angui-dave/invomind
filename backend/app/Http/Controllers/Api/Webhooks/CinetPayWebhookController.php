<?php

namespace App\Http\Controllers\Api\Webhooks;

use App\Contracts\PspGateway;
use App\Exceptions\InvalidPspAmountException;
use App\Http\Controllers\Controller;
use App\Jobs\SendPaymentReceiptJob;
use App\Models\PaymentIntent;
use App\Services\DocumentPaymentService;
use App\Services\SubscriptionBillingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CinetPayWebhookController extends Controller
{
    public function __construct(
        private PspGateway $gateway,
        private DocumentPaymentService $payments,
        private SubscriptionBillingService $saasBilling,
    ) {}

    public function handle(Request $request): JsonResponse
    {
        if ($request->isMethod('get')) {
            if (! in_array((string) config('app.env'), ['local', 'testing'], true)) {
                return response()->json(['message' => 'Method Not Allowed'], 405);
            }

            return response()->json(['status' => 'ok']);
        }

        if (! $this->gateway->verifySignature($request)) {
            return response()->json(['message' => 'Invalid signature'], 400);
        }

        $event = $this->gateway->parseWebhook($request);
        if ($event->transactionId === '') {
            return response()->json(['message' => 'Transaction id manquant'], 400);
        }

        $transaction = $this->gateway->fetchTransaction($event->transactionId);

        if (! $transaction->isAccepted()) {
            PaymentIntent::query()
                ->where('provider', PaymentIntent::PROVIDER_CINETPAY)
                ->where(function ($query) use ($event) {
                    $query->where('provider_transaction_id', $event->transactionId)
                        ->orWhere('id', $event->intentId ?? $event->transactionId);
                })
                ->whereIn('status', [PaymentIntent::STATUS_PENDING, PaymentIntent::STATUS_PROCESSING])
                ->update([
                    'status' => PaymentIntent::STATUS_FAILED,
                    'raw_payload' => $event->payload,
                ]);

            return response()->json(['status' => 'ignored']);
        }

        if (bccomp(bcadd($event->amount, '0', 2), bcadd($transaction->amount, '0', 2), 2) !== 0) {
            return response()->json(['message' => 'Montant webhook incohérent'], 422);
        }

        $intent = PaymentIntent::query()
            ->where('provider', PaymentIntent::PROVIDER_CINETPAY)
            ->where(function ($query) use ($event) {
                $query->where('provider_transaction_id', $event->transactionId);
                if ($event->intentId) {
                    $query->orWhere('id', $event->intentId);
                }
            })
            ->first();

        if ($intent?->isSaasPlan()) {
            try {
                $this->saasBilling->applySucceededWebhook(
                    PaymentIntent::PROVIDER_CINETPAY,
                    $event->transactionId,
                    $transaction->amount,
                    $event->payload,
                    $event->intentId,
                );
            } catch (InvalidPspAmountException $e) {
                return response()->json(['message' => $e->getMessage()], 422);
            }

            return response()->json(['status' => 'ok', 'purpose' => 'saas_plan']);
        }

        try {
            $payment = $this->payments->applySucceededWebhook(
                PaymentIntent::PROVIDER_CINETPAY,
                $event->transactionId,
                $transaction->amount,
                $event->payload,
                $event->intentId,
            );
        } catch (InvalidPspAmountException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        if ($payment->wasRecentlyCreated) {
            SendPaymentReceiptJob::dispatch($payment->organization_id, $payment->id);
        }

        return response()->json(['status' => 'ok', 'purpose' => 'document']);
    }
}

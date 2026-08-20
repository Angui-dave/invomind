<?php

namespace App\Services;

use App\Contracts\PspGateway;
use App\Exceptions\PaymentAlreadySettledException;
use App\Models\Document;
use App\Models\PaymentIntent;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class PaymentIntentService
{
    public function __construct(
        private DocumentPaymentService $payments,
        private EntitlementService $entitlements,
        private PspGateway $gateway,
    ) {}

    /**
     * Create or reuse an open checkout intent for the remaining balance.
     */
    public function createForDocument(Document $document, array $options = []): PaymentIntent
    {
        if ($document->kind !== 'invoice') {
            throw new HttpException(422, 'Seules les factures peuvent être encaissées en ligne.');
        }

        if (in_array($document->status, ['draft', 'cancelled'], true) || ! $document->frozen) {
            throw new HttpException(422, 'Ce document ne peut pas être payé.');
        }

        if (! $document->online_payment_enabled) {
            throw new HttpException(403, 'Le paiement en ligne n’est pas activé sur cette facture.');
        }

        $ent = $this->entitlements->check($document->organization_id);
        if (! $ent['online_payments']) {
            throw new HttpException(403, 'Le paiement en ligne est réservé au plan Pro.');
        }

        $amount = $this->payments->outstandingBalance($document);
        if (bccomp($amount, '0', 2) <= 0) {
            throw new PaymentAlreadySettledException;
        }

        $intent = DB::transaction(function () use ($document, $options, $amount) {
            $open = PaymentIntent::query()
                ->where('document_id', $document->id)
                ->whereIn('status', [PaymentIntent::STATUS_PENDING, PaymentIntent::STATUS_PROCESSING])
                ->where('amount', $amount)
                ->lockForUpdate()
                ->latest('created_at')
                ->first();

            if ($open) {
                $open->fill([
                    'method_hint' => $options['method_hint'] ?? $open->method_hint,
                    'customer_phone' => $options['customer_phone'] ?? $open->customer_phone,
                ])->save();

                return $open;
            }

            $attempt = PaymentIntent::query()->where('document_id', $document->id)->count() + 1;

            return PaymentIntent::query()->create([
                'organization_id' => $document->organization_id,
                'document_id' => $document->id,
                'purpose' => PaymentIntent::PURPOSE_DOCUMENT,
                'amount' => $amount,
                'currency' => $document->currency,
                'provider' => $options['provider'] ?? PaymentIntent::PROVIDER_CINETPAY,
                'status' => PaymentIntent::STATUS_PENDING,
                'method_hint' => $options['method_hint'] ?? null,
                'customer_phone' => $options['customer_phone'] ?? null,
                'idempotency_key' => sprintf(
                    '%s:%s:%s:%d',
                    $document->organization_id,
                    $document->id,
                    $amount,
                    $attempt,
                ),
            ]);
        });

        return $this->ensureCheckout($intent, $document);
    }

    private function ensureCheckout(PaymentIntent $intent, Document $document): PaymentIntent
    {
        if (filled($intent->checkout_url)) {
            return $intent;
        }

        $result = $this->gateway->createCheckout($intent, $document);

        $intent->update([
            'checkout_url' => $result->checkoutUrl,
            'provider_transaction_id' => $result->providerTransactionId ?: $intent->id,
            'status' => PaymentIntent::STATUS_PROCESSING,
            'raw_payload' => $result->raw,
        ]);

        return $intent->fresh();
    }
}

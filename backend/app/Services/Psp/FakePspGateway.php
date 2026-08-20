<?php

namespace App\Services\Psp;

use App\Contracts\PspGateway;
use App\Models\Document;
use App\Models\PaymentIntent;
use Illuminate\Http\Request;

class FakePspGateway implements PspGateway
{
    public string $checkoutUrl = 'https://checkout.cinetpay.test/pay';

    public bool $signatureValid = true;

    public string $fetchedStatus = 'ACCEPTED';

    public ?string $fetchedAmount = null;

    public ?PspWebhookEvent $lastEvent = null;

    /** @var list<string> */
    public array $checkoutIntentIds = [];

    public function createCheckout(PaymentIntent $intent, ?Document $doc = null): PspCheckoutResult
    {
        $this->checkoutIntentIds[] = $intent->id;

        return new PspCheckoutResult(
            checkoutUrl: $this->checkoutUrl.'/'.$intent->id,
            providerTransactionId: $intent->id,
            raw: ['fake' => true],
        );
    }

    public function verifySignature(Request $request): bool
    {
        return $this->signatureValid;
    }

    public function parseWebhook(Request $request): PspWebhookEvent
    {
        $transactionId = (string) $request->input('cpm_trans_id', '');
        $custom = $request->input('cpm_custom');

        $this->lastEvent = new PspWebhookEvent(
            transactionId: $transactionId,
            amount: (string) $request->input('cpm_amount', '0'),
            currency: (string) $request->input('cpm_currency', 'XOF'),
            payload: $request->all(),
            intentId: is_string($custom) && $custom !== '' ? $custom : $transactionId,
        );

        return $this->lastEvent;
    }

    public function fetchTransaction(string $providerTransactionId): PspTransaction
    {
        $amount = $this->fetchedAmount ?? $this->lastEvent?->amount ?? '0.00';

        return new PspTransaction(
            transactionId: $providerTransactionId,
            amount: $amount,
            currency: $this->lastEvent?->currency ?? 'XOF',
            status: $this->fetchedStatus,
        );
    }
}

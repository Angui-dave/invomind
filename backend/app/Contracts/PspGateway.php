<?php

namespace App\Contracts;

use App\Models\Document;
use App\Models\PaymentIntent;
use App\Services\Psp\PspCheckoutResult;
use App\Services\Psp\PspTransaction;
use App\Services\Psp\PspWebhookEvent;
use Illuminate\Http\Request;

interface PspGateway
{
    /**
     * @param  Document|null  $doc  Invoice document for portal checkout; null for SaaS plan checkout.
     */
    public function createCheckout(PaymentIntent $intent, ?Document $doc = null): PspCheckoutResult;

    public function verifySignature(Request $request): bool;

    public function parseWebhook(Request $request): PspWebhookEvent;

    public function fetchTransaction(string $providerTransactionId): PspTransaction;
}

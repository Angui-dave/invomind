<?php

namespace App\Services\Psp;

readonly class PspWebhookEvent
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public string $transactionId,
        public string $amount,
        public string $currency,
        public array $payload = [],
        public ?string $intentId = null,
    ) {}
}

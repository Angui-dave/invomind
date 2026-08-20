<?php

namespace App\Services\Psp;

readonly class PspCheckoutResult
{
    /**
     * @param  array<string, mixed>  $raw
     */
    public function __construct(
        public string $checkoutUrl,
        public ?string $providerTransactionId = null,
        public array $raw = [],
    ) {}
}

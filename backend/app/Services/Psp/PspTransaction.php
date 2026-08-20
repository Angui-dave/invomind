<?php

namespace App\Services\Psp;

readonly class PspTransaction
{
    /**
     * @param  array<string, mixed>  $raw
     */
    public function __construct(
        public string $transactionId,
        public string $amount,
        public string $currency,
        public string $status,
        public array $raw = [],
    ) {}

    public function isAccepted(): bool
    {
        return in_array(strtoupper($this->status), ['ACCEPTED', 'SUCCESS'], true);
    }
}

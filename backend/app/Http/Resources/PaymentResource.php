<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Payment
 */
class PaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'document_id' => $this->document_id,
            'document_number' => $this->document_number,
            'client_id' => $this->client_id,
            'client_name' => $this->client_name,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'method' => $this->method,
            'paid_at' => $this->paid_at,
            'reference' => $this->reference,
            'notes' => $this->notes,
            'source' => $this->source,
            'provider' => $this->provider,
            'created_at' => $this->created_at,
        ];
    }
}

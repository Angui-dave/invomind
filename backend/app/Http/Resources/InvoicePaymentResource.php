<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\InvoicePayment
 */
class InvoicePaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'orga_id' => $this->orga_id,
            'facture_id' => $this->facture_id,
            'client_id' => $this->client_id,
            'montant' => $this->montant,
            'devise' => $this->devise,
            'date_paiement' => $this->date_paiement,
            'mode_paiement' => $this->mode_paiement?->value ?? $this->mode_paiement,
            'reference' => $this->reference,
            'note' => $this->note,
            'created_at' => $this->created_at,
        ];
    }
}

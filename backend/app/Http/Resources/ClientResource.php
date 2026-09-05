<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Client
 */
class ClientResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'orga_id' => $this->orga_id,
            'user_id' => $this->user_id,
            'name_company' => $this->name_company,
            'email' => $this->email,
            'phone' => $this->phone,
            'adresse' => $this->adresse,
            'ville' => $this->ville,
            'code_postal' => $this->code_postal,
            'country' => $this->country,
            'devise' => $this->devise,
            'delai_paiement_jours' => $this->delai_paiement_jours ?? 30,
            'numero_fiscal' => $this->numero_fiscal,
            'categorie_client' => $this->categorie_client?->value ?? $this->categorie_client,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

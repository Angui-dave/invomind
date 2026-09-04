<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\ProductService
 */
class ProductServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'orga_id' => $this->orga_id,
            'user_id' => $this->user_id,
            'reference' => $this->reference,
            'name' => $this->name,
            'description' => $this->description,
            'type' => $this->type?->value ?? $this->type,
            'prix_unitaire' => $this->prix_unitaire,
            'devise' => $this->devise,
            'taux_tva' => $this->taux_tva,
            'unite' => $this->unite,
            'quantite_stock' => $this->quantite_stock,
            'gere_stock' => $this->gere_stock,
            'actif' => $this->actif,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\CatalogItem
 */
class CatalogItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'name' => $this->name,
            'description' => $this->description,
            'unit_price' => $this->unit_price,
            'currency' => $this->currency,
            'tax_rate' => $this->tax_rate,
            'unit' => $this->unit,
            'kind' => $this->kind,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

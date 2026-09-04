<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Supplier
 */
class SupplierResource extends JsonResource
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
            'contact' => $this->contact,
            'email' => $this->email,
            'phone' => $this->phone,
            'adresse' => $this->adresse,
            'ville' => $this->ville,
            'country' => $this->country,
            'numero_fiscal' => $this->numero_fiscal,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

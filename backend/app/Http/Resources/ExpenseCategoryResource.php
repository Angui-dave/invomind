<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\ExpenseCategory
 */
class ExpenseCategoryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'orga_id' => $this->orga_id,
            'nom' => $this->nom,
            'description' => $this->description,
            'couleur' => $this->couleur,
            'actif' => $this->actif,
            'is_global' => $this->orga_id === null,
            'created_at' => $this->created_at,
        ];
    }
}

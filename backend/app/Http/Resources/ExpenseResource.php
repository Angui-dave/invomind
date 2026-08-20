<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Expense
 */
class ExpenseResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'date' => $this->date,
            'description' => $this->description,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'category_id' => $this->category_id,
            'supplier_id' => $this->supplier_id,
            'supplier_name' => $this->supplier_name ?? $this->whenLoaded('supplier', fn () => $this->supplier?->name),
            'tax_rate' => $this->tax_rate,
            'tax_deductible' => $this->tax_deductible,
            'tax_amount' => $this->tax_amount,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

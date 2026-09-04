<?php

namespace App\Http\Requests;

use App\Enums\ProduitType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reference' => ['nullable', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['sometimes', Rule::enum(ProduitType::class)],
            'prix_unitaire' => ['required', 'numeric', 'min:0'],
            'devise' => ['nullable', 'string', 'size:3'],
            'taux_tva' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'unite' => ['nullable', 'string', 'max:20'],
            'quantite_stock' => ['nullable', 'integer', 'min:0'],
            'gere_stock' => ['sometimes', 'boolean'],
            'actif' => ['sometimes', 'boolean'],
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExpenseCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $orgId = $this->attributes->get('organization_id');
        $categoryId = $this->route('id');

        return [
            'nom' => [
                $this->isMethod('POST') ? 'required' : 'sometimes',
                'string',
                'max:100',
                Rule::unique('categories_depense', 'nom')
                    ->where(fn ($q) => $q->where('orga_id', $orgId))
                    ->ignore($categoryId),
            ],
            'description' => ['nullable', 'string'],
            'couleur' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'actif' => ['sometimes', 'boolean'],
        ];
    }
}

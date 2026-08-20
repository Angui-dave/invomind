<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $orgId = $this->attributes->get('organization_id');

        return [
            'date' => ['required', 'date_format:Y-m-d'],
            'description' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'string', 'max:3'],
            'category_id' => [
                'required',
                'uuid',
                Rule::exists('expense_categories', 'id')->where(fn ($q) => $q->where('organization_id', $orgId)),
            ],
            'supplier_id' => [
                'nullable',
                'uuid',
                Rule::exists('suppliers', 'id')->where(fn ($q) => $q->where('organization_id', $orgId)),
            ],
            'tax_rate' => ['sometimes', 'numeric', 'min:0'],
            'tax_deductible' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string'],
        ];
    }
}

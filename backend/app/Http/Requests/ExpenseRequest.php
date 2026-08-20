<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date' => ['required', 'date_format:Y-m-d'],
            'description' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'string', 'max:3'],
            'category_id' => ['required', 'uuid', 'exists:expense_categories,id'],
            'supplier_id' => ['nullable', 'uuid', 'exists:suppliers,id'],
            'tax_rate' => ['sometimes', 'numeric', 'min:0'],
            'tax_deductible' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string'],
        ];
    }
}

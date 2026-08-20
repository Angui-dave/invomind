<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $orgId = $this->attributes->get('organization_id');

        return [
            'kind' => ['required', 'in:quote,invoice,credit_note'],
            'client_id' => [
                'required',
                'uuid',
                Rule::exists('clients', 'id')->where(
                    fn ($q) => $q->where('organization_id', $orgId),
                ),
            ],
            'status' => ['sometimes', 'nullable', 'string'],
            'currency' => ['sometimes', 'string', 'max:3'],
            'tax_mode' => ['sometimes', 'in:exclusive,inclusive'],
            'issue_date' => ['required', 'date_format:Y-m-d'],
            'due_date' => ['required', 'date_format:Y-m-d'],
            'online_payment_enabled' => ['sometimes', 'boolean'],
            'reminders_enabled' => ['sometimes', 'boolean'],
            'source_document_id' => [
                'nullable',
                'uuid',
                Rule::exists('documents', 'id')->where(
                    fn ($q) => $q->where('organization_id', $orgId),
                ),
            ],
            'notes' => ['nullable', 'string'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.description' => ['required', 'string'],
            'lines.*.quantity' => ['required', 'numeric', 'min:0'],
            'lines.*.unit_price' => ['required', 'numeric', 'min:0'],
            'lines.*.tax_rate' => ['sometimes', 'numeric', 'min:0'],
            'lines.*.discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.catalog_item_id' => [
                'nullable',
                'uuid',
                Rule::exists('catalog_items', 'id')->where(
                    fn ($q) => $q->where('organization_id', $orgId),
                ),
            ],
        ];
    }
}

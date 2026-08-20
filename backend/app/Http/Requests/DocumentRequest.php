<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'kind' => ['required', 'in:quote,invoice,credit_note'],
            'client_id' => ['required', 'uuid', 'exists:clients,id'],
            'status' => ['required', 'string'],
            'currency' => ['sometimes', 'string', 'max:3'],
            'tax_mode' => ['sometimes', 'in:exclusive,inclusive'],
            'issue_date' => ['required', 'date_format:Y-m-d'],
            'due_date' => ['required', 'date_format:Y-m-d'],
            'online_payment_enabled' => ['sometimes', 'boolean'],
            'reminders_enabled' => ['sometimes', 'boolean'],
            'source_document_id' => ['nullable', 'uuid'],
            'notes' => ['nullable', 'string'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.description' => ['required', 'string'],
            'lines.*.quantity' => ['required', 'numeric', 'min:0'],
            'lines.*.unit_price' => ['required', 'numeric', 'min:0'],
            'lines.*.tax_rate' => ['sometimes', 'numeric', 'min:0'],
            'lines.*.discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.catalog_item_id' => ['nullable', 'uuid'],
        ];
    }
}

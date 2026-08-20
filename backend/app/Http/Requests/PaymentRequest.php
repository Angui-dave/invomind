<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'document_id' => ['required', 'uuid', 'exists:documents,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'currency' => ['sometimes', 'string', 'max:3'],
            'method' => ['required', 'in:card,mobile_money,transfer,twint,cash,check'],
            'paid_at' => ['required', 'date_format:Y-m-d'],
            'reference' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ];
    }
}

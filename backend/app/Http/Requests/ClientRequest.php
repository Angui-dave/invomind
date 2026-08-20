<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'company' => ['sometimes', 'string', 'max:255'],
            'email' => ['required', 'email'],
            'phone' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'postal_code' => ['nullable', 'string'],
            'country' => ['nullable', 'string'],
            'tax_id' => ['nullable', 'string'],
            'currency' => ['nullable', 'string', 'max:3'],
            'payment_term_days' => ['nullable', 'integer', 'min:0'],
            'reminders_enabled' => ['sometimes', 'boolean'],
        ];
    }
}

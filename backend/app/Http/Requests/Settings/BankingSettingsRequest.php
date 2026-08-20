<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class BankingSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bank_name' => ['sometimes', 'string'],
            'iban' => ['sometimes', 'string'],
            'bic' => ['sometimes', 'string'],
            'qr_iban' => ['nullable', 'string'],
            'twint_number' => ['nullable', 'string'],
            'mobile_money_provider' => ['nullable', 'string'],
            'mobile_money_number' => ['nullable', 'string'],
        ];
    }
}

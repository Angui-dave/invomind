<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class TaxSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'default_currency' => ['sometimes', 'string', 'max:3'],
            'default_tax_mode' => ['sometimes', 'in:exclusive,inclusive'],
            'default_tax_rate' => ['sometimes', 'integer', 'min:0', 'max:100'],
        ];
    }
}

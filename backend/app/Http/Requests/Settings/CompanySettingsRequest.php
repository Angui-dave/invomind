<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class CompanySettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email'],
            'phone' => ['sometimes', 'string'],
            'address' => ['sometimes', 'string'],
            'city' => ['sometimes', 'string'],
            'postal_code' => ['sometimes', 'string'],
            'country' => ['sometimes', 'string', 'max:2'],
            'tax_id' => ['sometimes', 'string'],
            'legal_mentions' => ['sometimes', 'string'],
        ];
    }
}

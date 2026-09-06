<?php

namespace App\Http\Requests;

use App\Enums\ClientCategorie;
use App\Support\OrgRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('reminders_enabled') && ! $this->has('relances_actives')) {
            $this->merge([
                'relances_actives' => $this->boolean('reminders_enabled'),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'name_company' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'ville' => ['nullable', 'string', 'max:100'],
            'code_postal' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'max:100'],
            'devise' => ['nullable', 'string', 'size:3'],
            'delai_paiement_jours' => ['nullable', 'integer', 'min:0', 'max:365'],
            'numero_fiscal' => ['nullable', 'string', 'max:64'],
            'categorie_client' => ['sometimes', Rule::enum(ClientCategorie::class)],
            'notes' => ['nullable', 'string'],
            'relances_actives' => ['sometimes', 'boolean'],
            'user_id' => ['nullable', 'integer', OrgRules::exists('users')],
        ];
    }
}

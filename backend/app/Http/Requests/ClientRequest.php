<?php

namespace App\Http\Requests;

use App\Enums\ClientCategorie;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
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
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}

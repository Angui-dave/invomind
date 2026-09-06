<?php

namespace App\Http\Requests;

use App\Support\OrgRules;
use Illuminate\Foundation\Http\FormRequest;

class QuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['required', 'integer', OrgRules::exists('clients')],
            'numero' => ['nullable', 'string', 'max:50'],
            'date_validite' => ['nullable', 'date'],
            'devise' => ['nullable', 'string', 'size:3'],
            'remise_montant' => ['nullable', 'numeric', 'min:0'],
            'note' => ['nullable', 'string'],
            'statut' => ['sometimes', 'string'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.produit_id' => ['nullable', 'integer', OrgRules::exists('produits_services')],
            'lines.*.designation' => ['required', 'string', 'max:255'],
            'lines.*.quantite' => ['required', 'numeric', 'gt:0'],
            'lines.*.prix_unitaire' => ['required', 'numeric', 'min:0'],
            'lines.*.taux_tva' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.remise_pourcentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }
}

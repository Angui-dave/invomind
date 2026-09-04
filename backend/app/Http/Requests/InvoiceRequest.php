<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'devis_id' => ['nullable', 'integer', 'exists:devis,id'],
            'numero' => ['nullable', 'string', 'max:50'],
            'date_echeance' => ['nullable', 'date'],
            'devise' => ['nullable', 'string', 'size:3'],
            'remise_montant' => ['nullable', 'numeric', 'min:0'],
            'note' => ['nullable', 'string'],
            'statut' => ['sometimes', 'string'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.produit_id' => ['nullable', 'integer', 'exists:produits_services,id'],
            'lines.*.designation' => ['required', 'string', 'max:255'],
            'lines.*.quantite' => ['required', 'numeric', 'gt:0'],
            'lines.*.prix_unitaire' => ['required', 'numeric', 'min:0'],
            'lines.*.taux_tva' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines.*.remise_pourcentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }
}

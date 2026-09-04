<?php

namespace App\Http\Requests;

use App\Enums\DepenseStatut;
use App\Enums\ModePaiement;
use App\Models\ExpenseCategory;
use App\Models\Supplier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'categorie_id' => ['nullable', 'integer'],
            'fournisseur_id' => ['nullable', 'integer'],
            'libelle' => [$required, 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'fournisseur' => ['nullable', 'string', 'max:255'],
            'reference' => ['nullable', 'string', 'max:100'],
            'montant_ht' => [$required, 'numeric', 'min:0'],
            'taux_tva' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'devise' => ['nullable', 'string', 'size:3'],
            'date_depense' => ['nullable', 'date'],
            'mode_paiement' => ['nullable', Rule::enum(ModePaiement::class)],
            'piece_jointe_url' => ['nullable', 'string'],
            'recurrente' => ['sometimes', 'boolean'],
            'frequence_recurrence' => ['nullable', 'string'],
            'statut' => ['sometimes', Rule::enum(DepenseStatut::class)],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $orgId = $this->attributes->get('organization_id');

            if ($this->filled('categorie_id')) {
                $exists = ExpenseCategory::query()
                    ->where('id', $this->input('categorie_id'))
                    ->where('actif', true)
                    ->where(function ($q) use ($orgId) {
                        $q->where('orga_id', $orgId)->orWhereNull('orga_id');
                    })
                    ->exists();

                if (! $exists) {
                    $validator->errors()->add('categorie_id', 'Catégorie invalide.');
                }
            }

            if ($this->filled('fournisseur_id')) {
                $exists = Supplier::query()
                    ->where('id', $this->input('fournisseur_id'))
                    ->where('orga_id', $orgId)
                    ->exists();

                if (! $exists) {
                    $validator->errors()->add('fournisseur_id', 'Fournisseur invalide.');
                }
            }
        });
    }
}

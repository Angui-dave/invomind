<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Expense
 */
class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'orga_id' => $this->orga_id,
            'user_id' => $this->user_id,
            'categorie_id' => $this->categorie_id,
            'fournisseur_id' => $this->fournisseur_id,
            'libelle' => $this->libelle,
            'description' => $this->description,
            'fournisseur' => $this->fournisseur,
            'reference' => $this->reference,
            'montant_ht' => $this->montant_ht,
            'taux_tva' => $this->taux_tva,
            'montant_tva' => $this->montant_tva,
            'montant_ttc' => $this->montant_ttc,
            'devise' => $this->devise,
            'date_depense' => $this->date_depense,
            'mode_paiement' => $this->mode_paiement?->value ?? $this->mode_paiement,
            'piece_jointe_url' => $this->piece_jointe_url,
            'recurrente' => $this->recurrente,
            'frequence_recurrence' => $this->frequence_recurrence?->value ?? $this->frequence_recurrence,
            'statut' => $this->statut?->value ?? $this->statut,
            'category' => $this->whenLoaded('category', fn () => $this->category
                ? new ExpenseCategoryResource($this->category)
                : null),
            'supplier' => $this->whenLoaded('supplier', fn () => $this->supplier
                ? new SupplierResource($this->supplier)
                : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Invoice
 */
class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $total = (float) $this->montant_total;
        $paid = (float) $this->montant_paye;

        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'orga_id' => $this->orga_id,
            'user_id' => $this->user_id,
            'client_id' => $this->client_id,
            'devis_id' => $this->devis_id,
            'numero' => $this->numero,
            'date_creation' => $this->date_creation,
            'date_echeance' => $this->date_echeance,
            'statut' => $this->statut?->value ?? $this->statut,
            'devise' => $this->devise,
            'sous_total' => $this->sous_total,
            'remise_montant' => $this->remise_montant,
            'montant_tva' => $this->montant_tva,
            'montant_total' => $this->montant_total,
            'montant_paye' => $this->montant_paye,
            'balance_due' => max(0, round($total - $paid, 2)),
            'note' => $this->note,
            'client' => $this->whenLoaded('client', fn () => $this->client
                ? [
                    'id' => $this->client->id,
                    'name_company' => $this->client->name_company,
                ]
                : null),
            'lines' => $this->whenLoaded('lines', fn () => $this->lines->map(fn ($line) => [
                'id' => $line->id,
                'produit_id' => $line->produit_id,
                'designation' => $line->designation,
                'quantite' => $line->quantite,
                'prix_unitaire' => $line->prix_unitaire,
                'taux_tva' => $line->taux_tva,
                'remise_pourcentage' => $line->remise_pourcentage,
                'montant_ht' => $line->montant_ht,
                'montant_tva' => $line->montant_tva,
                'ordre' => $line->ordre,
            ])),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\MessageTemplate */
class MessageTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'boite_reception_id' => $this->boite_reception_id,
            'nom' => $this->nom,
            'langue' => $this->langue,
            'categorie' => $this->categorie?->value ?? $this->categorie,
            'composants' => $this->composants,
            'statut_approbation' => $this->statut_approbation?->value ?? $this->statut_approbation,
            'id_externe_meta' => $this->id_externe_meta,
            'corps_apercu' => $this->corps_apercu,
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ConversationMessage */
class ConversationMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'conversation_id' => $this->conversation_id,
            'boite_reception_id' => $this->boite_reception_id,
            'direction' => $this->direction?->value ?? $this->direction,
            'type_contenu' => $this->type_contenu?->value ?? $this->type_contenu,
            'contenu' => $this->contenu,
            'url_media' => $this->url_media,
            'id_externe' => $this->id_externe,
            'statut_livraison' => $this->statut_livraison?->value ?? $this->statut_livraison,
            'erreur' => $this->erreur,
            'expediteur_agent_id' => $this->expediteur_agent_id,
            'envoye_at' => optional($this->envoye_at)?->toIso8601String(),
            'created_at' => optional($this->created_at)?->toIso8601String(),
        ];
    }
}

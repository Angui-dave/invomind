<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Conversation */
class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $contact = $this->whenLoaded('contact');
        $inbox = $this->whenLoaded('inbox');
        $lastMessage = $this->whenLoaded('messages', function () {
            return $this->messages->sortByDesc('envoye_at')->first();
        });

        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'orga_id' => $this->orga_id,
            'boite_reception_id' => $this->boite_reception_id,
            'contact_id' => $this->contact_id,
            'statut' => $this->statut?->value ?? $this->statut,
            'agent_id' => $this->agent_id,
            'derniere_activite_at' => optional($this->derniere_activite_at)?->toIso8601String(),
            'non_lus_count' => $this->non_lus_count,
            'archivee' => $this->archivee,
            'canal' => $this->when(
                $this->relationLoaded('inbox'),
                fn () => $this->inbox?->canal?->value
            ),
            'contact' => $this->when($this->relationLoaded('contact'), function () {
                $handle = null;
                if ($this->contact && $this->relationLoaded('contact') && $this->contact->relationLoaded('inboxLinks')) {
                    $handle = $this->contact->inboxLinks
                        ->firstWhere('boite_reception_id', $this->boite_reception_id)
                        ?->identifiant_externe;
                }

                return [
                    'id' => $this->contact?->id,
                    'nom_affichage' => $this->contact?->nom_affichage,
                    'client_id' => $this->contact?->client_id,
                    'avatar_url' => $this->contact?->avatar_url,
                    'identifiant_externe' => $handle,
                ];
            }),
            'agent' => $this->when($this->relationLoaded('agent'), fn () => $this->agent ? [
                'id' => $this->agent->id,
                'full_name' => $this->agent->full_name ?? $this->agent->name,
                'email' => $this->agent->email,
            ] : null),
            'labels' => LabelResource::collection($this->whenLoaded('labels')),
            'dernier_message' => $this->when(
                $this->relationLoaded('messages') && $lastMessage,
                fn () => new ConversationMessageResource($lastMessage)
            ),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}

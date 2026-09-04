<?php

namespace App\Services\Messagerie;

use App\Enums\DirectionMessage;
use App\Enums\TypeContenuMessage;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use Carbon\Carbon;

class FenetreReponseService
{
    public function estOuverte(Conversation $conversation): bool
    {
        $inbox = $conversation->relationLoaded('inbox')
            ? $conversation->inbox
            : $conversation->inbox()->first();

        if ($inbox?->mode?->value === 'fake') {
            return true;
        }

        $canal = $inbox?->canal?->value ?? 'whatsapp';
        $heures = (int) config("messagerie.fenetre_reponse_heures.{$canal}", 24);

        $dernierEntrant = ConversationMessage::query()
            ->where('conversation_id', $conversation->id)
            ->where('direction', DirectionMessage::Entrant)
            ->orderByDesc('envoye_at')
            ->first();

        if (! $dernierEntrant?->envoye_at) {
            return false;
        }

        return Carbon::parse($dernierEntrant->envoye_at)->gt(now()->subHours($heures));
    }

    /**
     * Templates (type_contenu=modele) are exempt from the customer-care window.
     */
    public function assertOuverte(Conversation $conversation, ?TypeContenuMessage $type = null): void
    {
        if ($type === TypeContenuMessage::Modele) {
            return;
        }

        if (! $this->estOuverte($conversation)) {
            $canal = $conversation->inbox?->canal?->value ?? 'whatsapp';
            $heures = (int) config("messagerie.fenetre_reponse_heures.{$canal}", 24);
            abort(
                422,
                "La fenêtre de réponse de {$heures}h est expirée. Envoyez un modèle (template) WhatsApp approuvé.",
            );
        }
    }
}

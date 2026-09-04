<?php

namespace App\Services\Messagerie;

use App\Enums\StatutLivraisonMessage;
use App\Events\NouveauMessageConversation;
use App\Models\ConversationMessage;
use App\Models\Inbox;
use App\Services\Messagerie\Dto\NormalizedStatusUpdateDto;
use Illuminate\Support\Facades\Log;

class DeliveryStatusService
{
    public function appliquer(NormalizedStatusUpdateDto $dto): ?ConversationMessage
    {
        $inbox = $this->resolveInbox($dto);
        if (! $inbox) {
            return null;
        }

        $message = ConversationMessage::withoutGlobalScopes()
            ->where('boite_reception_id', $inbox->id)
            ->where('id_externe', $dto->messageExternalId)
            ->first();

        if (! $message) {
            Log::debug('Delivery status for unknown message', [
                'id_externe' => $dto->messageExternalId,
                'inbox_id' => $inbox->id,
            ]);

            return null;
        }

        $newStatus = match ($dto->statut) {
            'sent' => StatutLivraisonMessage::Envoye,
            'delivered' => StatutLivraisonMessage::Livre,
            'read' => StatutLivraisonMessage::Lu,
            'failed' => StatutLivraisonMessage::Echec,
            default => null,
        };

        if (! $newStatus) {
            return $message;
        }

        // Never downgrade (e.g. read → delivered)
        $rank = [
            StatutLivraisonMessage::EnAttente->value => 0,
            StatutLivraisonMessage::Envoye->value => 1,
            StatutLivraisonMessage::Livre->value => 2,
            StatutLivraisonMessage::Lu->value => 3,
            StatutLivraisonMessage::Echec->value => 4,
        ];
        $current = $message->statut_livraison?->value ?? StatutLivraisonMessage::EnAttente->value;
        if (($rank[$newStatus->value] ?? 0) < ($rank[$current] ?? 0) && $newStatus !== StatutLivraisonMessage::Echec) {
            return $message;
        }

        $message->update([
            'statut_livraison' => $newStatus,
            'erreur' => $dto->erreur,
        ]);

        $fresh = $message->fresh(['conversation.inbox', 'conversation.contact']);
        event(new NouveauMessageConversation($fresh));

        return $fresh;
    }

    private function resolveInbox(NormalizedStatusUpdateDto $dto): ?Inbox
    {
        $inboxes = Inbox::withoutGlobalScopes()
            ->where('canal', $dto->canal)
            ->where('actif', true)
            ->orderBy('id')
            ->get();

        foreach ($inboxes as $inbox) {
            $creds = $inbox->identifiants ?? [];
            $candidates = array_filter([
                $creds['phone_number_id'] ?? null,
                $creds['page_id'] ?? null,
                $creds['ig_business_id'] ?? null,
                $creds['waba_id'] ?? null,
                $creds['external_id'] ?? null,
            ]);
            if (in_array($dto->inboxExternalId, $candidates, true)) {
                return $inbox;
            }
        }

        return null;
    }
}

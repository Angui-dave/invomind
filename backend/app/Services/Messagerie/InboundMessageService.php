<?php

namespace App\Services\Messagerie;

use App\Enums\CanalMessagerie;
use App\Enums\DirectionMessage;
use App\Enums\StatutConversation;
use App\Enums\StatutLivraisonMessage;
use App\Enums\TypeContenuMessage;
use App\Events\NouveauMessageConversation;
use App\Models\ContactInbox;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\Inbox;
use App\Models\MessagingContact;
use App\Services\Messagerie\Dto\NormalizedInboundMessageDto;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InboundMessageService
{
    public function __construct(private MediaDownloadService $media) {}

    public function ingerer(NormalizedInboundMessageDto $dto): ?ConversationMessage
    {
        $inbox = $this->resolveInbox($dto);
        if (! $inbox) {
            return null;
        }

        return DB::transaction(function () use ($dto, $inbox) {
            $existing = ConversationMessage::withoutGlobalScopes()
                ->where('boite_reception_id', $inbox->id)
                ->where('id_externe', $dto->messageExternalId)
                ->first();

            if ($existing) {
                return $existing;
            }

            $contactLink = ContactInbox::query()
                ->where('boite_reception_id', $inbox->id)
                ->where('identifiant_externe', $dto->contactExternalId)
                ->first();

            if (! $contactLink) {
                $contact = MessagingContact::withoutGlobalScopes()->create([
                    'orga_id' => $inbox->orga_id,
                    'nom_affichage' => $dto->contactName ?: $dto->contactExternalId,
                ]);

                $contactLink = ContactInbox::query()->create([
                    'contact_id' => $contact->id,
                    'boite_reception_id' => $inbox->id,
                    'identifiant_externe' => $dto->contactExternalId,
                    'donnees_brutes' => $dto->raw,
                ]);
            } else {
                $contact = MessagingContact::withoutGlobalScopes()->findOrFail($contactLink->contact_id);
                if ($dto->contactName && $contact->nom_affichage === $dto->contactExternalId) {
                    $contact->update(['nom_affichage' => $dto->contactName]);
                }
            }

            $conversation = Conversation::withoutGlobalScopes()
                ->where('boite_reception_id', $inbox->id)
                ->where('contact_id', $contact->id)
                ->whereIn('statut', [StatutConversation::Ouverte->value, StatutConversation::EnAttente->value])
                ->orderByDesc('derniere_activite_at')
                ->first();

            if (! $conversation) {
                $conversation = Conversation::withoutGlobalScopes()->create([
                    'orga_id' => $inbox->orga_id,
                    'boite_reception_id' => $inbox->id,
                    'contact_id' => $contact->id,
                    'statut' => StatutConversation::Ouverte,
                    'derniere_activite_at' => $dto->envoyeAt ?? now(),
                    'non_lus_count' => 0,
                ]);
            }

            $urlMedia = $this->media->resoudreUrlMedia($dto->urlMedia, $inbox, $dto->typeContenu);

            try {
                $message = ConversationMessage::withoutGlobalScopes()->create([
                    'orga_id' => $inbox->orga_id,
                    'conversation_id' => $conversation->id,
                    'boite_reception_id' => $inbox->id,
                    'direction' => DirectionMessage::Entrant,
                    'type_contenu' => TypeContenuMessage::tryFrom($dto->typeContenu) ?? TypeContenuMessage::Texte,
                    'contenu' => $dto->contenu,
                    'url_media' => $urlMedia,
                    'id_externe' => $dto->messageExternalId,
                    'statut_livraison' => StatutLivraisonMessage::Livre,
                    'envoye_at' => $dto->envoyeAt ?? now(),
                ]);
            } catch (QueryException $e) {
                // Race on unique (boite_reception_id, id_externe)
                $existing = ConversationMessage::withoutGlobalScopes()
                    ->where('boite_reception_id', $inbox->id)
                    ->where('id_externe', $dto->messageExternalId)
                    ->first();

                return $existing;
            }

            $conversation->update([
                'derniere_activite_at' => $message->envoye_at,
                'non_lus_count' => $conversation->non_lus_count + 1,
                'statut' => StatutConversation::Ouverte,
                'archivee' => false,
            ]);

            event(new NouveauMessageConversation($message->fresh(['conversation.inbox', 'conversation.contact'])));

            return $message;
        });
    }

    private function resolveInbox(NormalizedInboundMessageDto $dto): ?Inbox
    {
        $canal = CanalMessagerie::tryFrom($dto->canal);
        if (! $canal) {
            return null;
        }

        $inboxes = Inbox::withoutGlobalScopes()
            ->where('canal', $canal->value)
            ->where('actif', true)
            ->orderBy('id')
            ->get();

        $matches = [];

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
                $matches[] = $inbox;

                continue;
            }

            // Fake mode: match by external_id or accept any fake inbox for canal
            if ($inbox->mode?->value === 'fake' && (
                ($creds['external_id'] ?? null) === $dto->inboxExternalId
                || $dto->inboxExternalId === 'fake-inbox'
            )) {
                $matches[] = $inbox;
            }
        }

        if ($matches === []) {
            return null;
        }

        if (count($matches) > 1) {
            Log::warning('Multiple inboxes match inbound external id', [
                'canal' => $dto->canal,
                'inbox_external_id' => $dto->inboxExternalId,
                'inbox_ids' => array_map(fn (Inbox $i) => $i->id, $matches),
                'orga_ids' => array_map(fn (Inbox $i) => $i->orga_id, $matches),
            ]);
        }

        // Deterministic: lowest id (first configured) to avoid random cross-tenant routing
        return $matches[0];
    }
}

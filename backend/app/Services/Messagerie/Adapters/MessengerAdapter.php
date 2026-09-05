<?php

namespace App\Services\Messagerie\Adapters;

use App\Enums\TypeContenuMessage;
use App\Models\ConversationMessage;
use App\Models\Inbox;
use App\Services\Messagerie\Dto\NormalizedInboundMessageDto;
use App\Services\Messagerie\Dto\ResultatEnvoiDto;
use Illuminate\Http\Request;

class MessengerAdapter extends AbstractMetaAdapter
{
    public function normaliserEvenement(Request $request): array
    {
        $payload = $request->all();
        if (($payload['object'] ?? null) !== 'page') {
            return [];
        }

        $messages = [];
        foreach ($payload['entry'] ?? [] as $entry) {
            $messages = array_merge(
                $messages,
                $this->parseMessengerOrInstagramEntry(is_array($entry) ? $entry : [], 'messenger')
            );
        }

        return array_values(array_filter(
            $messages,
            fn (NormalizedInboundMessageDto $m) => $m->messageExternalId !== '' && $m->contactExternalId !== ''
        ));
    }

    public function normaliserStatuts(Request $request): array
    {
        $payload = $request->all();
        if (($payload['object'] ?? null) !== 'page') {
            return [];
        }

        $statuses = [];
        foreach ($payload['entry'] ?? [] as $entry) {
            $statuses = array_merge(
                $statuses,
                $this->parseMessengerDelivery(is_array($entry) ? $entry : [], 'messenger')
            );
        }

        return array_values(array_filter(
            $statuses,
            fn ($s) => $s->messageExternalId !== ''
        ));
    }

    public function envoyerMessage(Inbox $boite, ConversationMessage $message, string $destinataireExterne): ResultatEnvoiDto
    {
        $creds = $boite->identifiants ?? [];
        $token = (string) ($creds['access_token'] ?? '');
        $pageId = (string) ($creds['page_id'] ?? '');

        if ($token === '' || $pageId === '') {
            return new ResultatEnvoiDto(false, null, 'Identifiants Messenger incomplets (access_token, page_id).');
        }

        $messagePayload = $this->buildMessengerMessage($message);
        if ($messagePayload === null) {
            return new ResultatEnvoiDto(false, null, 'Type de contenu non supporté ou url_media manquante.');
        }

        return $this->postGraph("{$pageId}/messages", $token, [
            'recipient' => ['id' => $destinataireExterne],
            'messaging_type' => 'RESPONSE',
            'message' => $messagePayload,
        ]);
    }

    public function souscrirePageWebhook(Inbox $boite): ResultatEnvoiDto
    {
        return $this->subscribePageFields($boite, [
            'messages',
            'messaging_postbacks',
            'message_deliveries',
            'message_reads',
        ]);
    }

    public function verifierIdentifiants(Inbox $boite): ResultatEnvoiDto
    {
        return $this->verifyPageCredentials($boite);
    }

    public function resoudreNomContact(Inbox $boite, string $externalId): ?string
    {
        return $this->resolvePageUserName($boite, $externalId);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function buildMessengerMessage(ConversationMessage $message): ?array
    {
        $type = $message->type_contenu instanceof TypeContenuMessage
            ? $message->type_contenu
            : TypeContenuMessage::tryFrom((string) $message->type_contenu);

        $mediaUrl = $message->url_media ? (string) $message->url_media : null;

        return match ($type) {
            TypeContenuMessage::Image,
            TypeContenuMessage::Audio,
            TypeContenuMessage::Video,
            TypeContenuMessage::Fichier => $mediaUrl ? [
                'attachment' => [
                    'type' => match ($type) {
                        TypeContenuMessage::Image => 'image',
                        TypeContenuMessage::Audio => 'audio',
                        TypeContenuMessage::Video => 'video',
                        default => 'file',
                    },
                    'payload' => ['url' => $mediaUrl, 'is_reusable' => true],
                ],
            ] : null,
            default => ['text' => (string) $message->contenu],
        };
    }
}

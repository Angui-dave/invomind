<?php

namespace App\Services\Messagerie\Adapters;

use App\Enums\TypeContenuMessage;
use App\Models\ConversationMessage;
use App\Models\Inbox;
use App\Services\Messagerie\Dto\NormalizedInboundMessageDto;
use App\Services\Messagerie\Dto\ResultatEnvoiDto;
use Illuminate\Http\Request;

class WhatsAppAdapter extends AbstractMetaAdapter
{
    public function normaliserEvenement(Request $request): array
    {
        $payload = $request->all();
        if (($payload['object'] ?? null) !== 'whatsapp_business_account') {
            return [];
        }

        $messages = [];
        foreach ($payload['entry'] ?? [] as $entry) {
            $messages = array_merge($messages, $this->parseWhatsAppEntry(is_array($entry) ? $entry : []));
        }

        return array_values(array_filter(
            $messages,
            fn (NormalizedInboundMessageDto $m) => $m->messageExternalId !== '' && $m->contactExternalId !== ''
        ));
    }

    public function normaliserStatuts(Request $request): array
    {
        $payload = $request->all();
        if (($payload['object'] ?? null) !== 'whatsapp_business_account') {
            return [];
        }

        $statuses = [];
        foreach ($payload['entry'] ?? [] as $entry) {
            $statuses = array_merge($statuses, $this->parseWhatsAppStatuses(is_array($entry) ? $entry : []));
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
        $phoneNumberId = (string) ($creds['phone_number_id'] ?? '');

        if ($token === '' || $phoneNumberId === '') {
            return new ResultatEnvoiDto(false, null, 'Identifiants WhatsApp incomplets (access_token, phone_number_id).');
        }

        $payload = $this->buildWhatsAppPayload($message, $destinataireExterne);
        if ($payload === null) {
            return new ResultatEnvoiDto(false, null, 'Type de contenu non supporté ou url_media manquante.');
        }

        return $this->postGraph("{$phoneNumberId}/messages", $token, $payload);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function buildWhatsAppPayload(ConversationMessage $message, string $to): ?array
    {
        $type = $message->type_contenu instanceof TypeContenuMessage
            ? $message->type_contenu
            : TypeContenuMessage::tryFrom((string) $message->type_contenu);

        $base = [
            'messaging_product' => 'whatsapp',
            'to' => $to,
        ];

        $mediaUrl = $message->url_media ? (string) $message->url_media : null;

        return match ($type) {
            TypeContenuMessage::Image => $mediaUrl ? array_merge($base, [
                'type' => 'image',
                'image' => array_filter([
                    'link' => $mediaUrl,
                    'caption' => $message->contenu ?: null,
                ]),
            ]) : null,
            TypeContenuMessage::Audio => $mediaUrl ? array_merge($base, [
                'type' => 'audio',
                'audio' => ['link' => $mediaUrl],
            ]) : null,
            TypeContenuMessage::Video => $mediaUrl ? array_merge($base, [
                'type' => 'video',
                'video' => array_filter([
                    'link' => $mediaUrl,
                    'caption' => $message->contenu ?: null,
                ]),
            ]) : null,
            TypeContenuMessage::Fichier => $mediaUrl ? array_merge($base, [
                'type' => 'document',
                'document' => array_filter([
                    'link' => $mediaUrl,
                    'caption' => $message->contenu ?: null,
                    'filename' => basename(parse_url($mediaUrl, PHP_URL_PATH) ?: 'fichier'),
                ]),
            ]) : null,
            TypeContenuMessage::Modele => $this->buildTemplatePayload($message, $base),
            default => array_merge($base, [
                'type' => 'text',
                'text' => ['body' => (string) $message->contenu],
            ]),
        };
    }

    /**
     * @param  array<string, mixed>  $base
     * @return array<string, mixed>|null
     */
    private function buildTemplatePayload(ConversationMessage $message, array $base): ?array
    {
        // contenu stores JSON: { name, language, components? }
        $raw = (string) $message->contenu;
        $decoded = json_decode($raw, true);
        if (! is_array($decoded) || empty($decoded['name'])) {
            return null;
        }

        $language = is_array($decoded['language'] ?? null)
            ? $decoded['language']
            : ['code' => (string) ($decoded['language'] ?? 'fr')];

        return array_merge($base, [
            'type' => 'template',
            'template' => array_filter([
                'name' => (string) $decoded['name'],
                'language' => $language,
                'components' => $decoded['components'] ?? null,
            ]),
        ]);
    }
}

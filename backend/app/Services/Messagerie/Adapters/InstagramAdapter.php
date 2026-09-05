<?php

namespace App\Services\Messagerie\Adapters;

use App\Models\ConversationMessage;
use App\Models\Inbox;
use App\Services\Messagerie\Dto\NormalizedInboundMessageDto;
use App\Services\Messagerie\Dto\ResultatEnvoiDto;
use Illuminate\Http\Request;

class InstagramAdapter extends AbstractMetaAdapter
{
    public function normaliserEvenement(Request $request): array
    {
        $payload = $request->all();
        if (! in_array($payload['object'] ?? null, ['instagram'], true)) {
            return [];
        }

        $messages = [];
        foreach ($payload['entry'] ?? [] as $entry) {
            $messages = array_merge(
                $messages,
                $this->parseMessengerOrInstagramEntry(is_array($entry) ? $entry : [], 'instagram')
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
        if (! in_array($payload['object'] ?? null, ['instagram', 'page'], true)) {
            return [];
        }

        $statuses = [];
        foreach ($payload['entry'] ?? [] as $entry) {
            $statuses = array_merge(
                $statuses,
                $this->parseMessengerDelivery(is_array($entry) ? $entry : [], 'instagram')
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
        $igId = (string) ($creds['ig_business_id'] ?? $creds['page_id'] ?? '');

        if ($token === '' || $igId === '') {
            return new ResultatEnvoiDto(false, null, 'Identifiants Instagram incomplets (access_token, ig_business_id).');
        }

        return $this->postGraph("{$igId}/messages", $token, [
            'recipient' => ['id' => $destinataireExterne],
            'message' => ['text' => (string) $message->contenu],
        ]);
    }

    public function souscrirePageWebhook(Inbox $boite): ResultatEnvoiDto
    {
        // Instagram Messaging webhooks are subscribed on the linked Facebook Page.
        return $this->subscribePageFields($boite, [
            'messages',
            'messaging_postbacks',
            'message_deliveries',
            'message_reads',
        ]);
    }

    public function verifierIdentifiants(Inbox $boite): ResultatEnvoiDto
    {
        $creds = $boite->identifiants ?? [];
        $token = (string) ($creds['access_token'] ?? '');
        $igId = (string) ($creds['ig_business_id'] ?? '');
        $pageId = (string) ($creds['page_id'] ?? '');

        if ($token === '') {
            return new ResultatEnvoiDto(false, null, 'Identifiants Instagram incomplets (access_token).');
        }

        if ($igId !== '') {
            $data = $this->getGraph($igId, $token, ['fields' => 'id,name,username']);
            if ($data === null || ! isset($data['id'])) {
                return new ResultatEnvoiDto(false, null, 'Impossible de vérifier le compte Instagram (token ou ig_business_id invalide).');
            }

            return new ResultatEnvoiDto(true, (string) $data['id']);
        }

        if ($pageId !== '') {
            return $this->verifyPageCredentials($boite);
        }

        return new ResultatEnvoiDto(false, null, 'Identifiants Instagram incomplets (ig_business_id ou page_id).');
    }

    public function resoudreNomContact(Inbox $boite, string $externalId): ?string
    {
        return $this->resolvePageUserName($boite, $externalId);
    }
}

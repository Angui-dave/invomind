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
}

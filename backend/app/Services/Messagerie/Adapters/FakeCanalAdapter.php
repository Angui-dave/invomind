<?php

namespace App\Services\Messagerie\Adapters;

use App\Models\ConversationMessage;
use App\Models\Inbox;
use App\Services\Messagerie\Contracts\CanalAdapterInterface;
use App\Services\Messagerie\Dto\NormalizedInboundMessageDto;
use App\Services\Messagerie\Dto\ResultatEnvoiDto;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FakeCanalAdapter implements CanalAdapterInterface
{
    public function verifierSignatureWebhook(Request $request): bool
    {
        return true;
    }

    public function normaliserEvenement(Request $request): array
    {
        $payload = $request->all();
        if (! isset($payload['fake_message'])) {
            return [];
        }

        $msg = $payload['fake_message'];

        return [
            new NormalizedInboundMessageDto(
                canal: (string) ($msg['canal'] ?? 'whatsapp'),
                inboxExternalId: (string) ($msg['inbox_external_id'] ?? 'fake-inbox'),
                contactExternalId: (string) ($msg['contact_external_id'] ?? 'fake-contact'),
                messageExternalId: (string) ($msg['message_external_id'] ?? Str::uuid()),
                contenu: (string) ($msg['contenu'] ?? ''),
                typeContenu: (string) ($msg['type_contenu'] ?? 'texte'),
                contactName: $msg['contact_name'] ?? 'Contact Fake',
                envoyeAt: now(),
                raw: is_array($msg) ? $msg : null,
            ),
        ];
    }

    public function normaliserStatuts(Request $request): array
    {
        return [];
    }

    public function envoyerMessage(Inbox $boite, ConversationMessage $message, string $destinataireExterne): ResultatEnvoiDto
    {
        if (str_contains((string) $message->contenu, '[FAIL]')) {
            return new ResultatEnvoiDto(false, null, 'Échec simulé (contenu contient [FAIL]).');
        }

        return new ResultatEnvoiDto(true, 'fake_'.Str::uuid()->toString());
    }
}

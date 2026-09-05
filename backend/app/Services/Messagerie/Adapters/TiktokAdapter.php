<?php

namespace App\Services\Messagerie\Adapters;

use App\Models\ConversationMessage;
use App\Models\Inbox;
use App\Services\Messagerie\Contracts\CanalAdapterInterface;
use App\Services\Messagerie\Dto\ResultatEnvoiDto;
use App\Services\Messagerie\Exceptions\CanalIndisponibleException;
use Illuminate\Http\Request;

class TiktokAdapter implements CanalAdapterInterface
{
    public function verifierSignatureWebhook(Request $request): bool
    {
        if (! config('messagerie.tiktok.enabled')) {
            return false;
        }

        $secret = (string) config('services.tiktok.client_secret', '');
        if ($secret === '') {
            return false;
        }

        $signature = (string) $request->header('TikTok-Signature', $request->header('X-TikTok-Signature', ''));
        if ($signature === '') {
            return false;
        }

        $expected = hash_hmac('sha256', $request->getContent(), $secret);

        return hash_equals($expected, $signature);
    }

    public function normaliserEvenement(Request $request): array
    {
        // TikTok Business Messaging API — stub until regional access is confirmed.
        return [];
    }

    public function normaliserStatuts(Request $request): array
    {
        return [];
    }

    public function envoyerMessage(Inbox $boite, ConversationMessage $message, string $destinataireExterne): ResultatEnvoiDto
    {
        throw new CanalIndisponibleException(
            'TikTok Business Messaging API n’est pas encore activée. Voir docs/MESSAGERIE.md.'
        );
    }

    public function souscrirePageWebhook(Inbox $boite): ResultatEnvoiDto
    {
        return new ResultatEnvoiDto(false, null, 'TikTok non disponible.');
    }

    public function verifierIdentifiants(Inbox $boite): ResultatEnvoiDto
    {
        return new ResultatEnvoiDto(false, null, 'TikTok non disponible.');
    }

    public function resoudreNomContact(Inbox $boite, string $externalId): ?string
    {
        return null;
    }
}

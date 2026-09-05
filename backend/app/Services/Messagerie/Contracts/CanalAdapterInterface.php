<?php

namespace App\Services\Messagerie\Contracts;

use App\Models\ConversationMessage;
use App\Models\Inbox;
use App\Services\Messagerie\Dto\NormalizedInboundMessageDto;
use App\Services\Messagerie\Dto\NormalizedStatusUpdateDto;
use App\Services\Messagerie\Dto\ResultatEnvoiDto;
use Illuminate\Http\Request;

interface CanalAdapterInterface
{
    public function verifierSignatureWebhook(Request $request): bool;

    /**
     * @return list<NormalizedInboundMessageDto>
     */
    public function normaliserEvenement(Request $request): array;

    /**
     * Delivery / read receipts (optional per canal).
     *
     * @return list<NormalizedStatusUpdateDto>
     */
    public function normaliserStatuts(Request $request): array;

    public function envoyerMessage(Inbox $boite, ConversationMessage $message, string $destinataireExterne): ResultatEnvoiDto;

    /**
     * Subscribe the Page / IG account to this app's webhook fields.
     */
    public function souscrirePageWebhook(Inbox $boite): ResultatEnvoiDto;

    /**
     * Validate stored credentials against the Graph API.
     */
    public function verifierIdentifiants(Inbox $boite): ResultatEnvoiDto;

    /**
     * Resolve a human-readable contact name from a platform external id (PSID, etc.).
     */
    public function resoudreNomContact(Inbox $boite, string $externalId): ?string;
}

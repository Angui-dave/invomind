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
}

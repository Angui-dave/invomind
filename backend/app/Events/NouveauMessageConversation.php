<?php

namespace App\Events;

use App\Models\ConversationMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NouveauMessageConversation implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ConversationMessage $message) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('organisation.'.$this->message->orga_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.nouveau';
    }

    public function broadcastWith(): array
    {
        $message = $this->message->loadMissing(['conversation.inbox', 'conversation.contact']);

        return [
            'message' => [
                'id' => $message->id,
                'uuid' => $message->uuid,
                'conversation_id' => $message->conversation_id,
                'direction' => $message->direction?->value,
                'type_contenu' => $message->type_contenu?->value,
                'contenu' => $message->contenu,
                'url_media' => $message->url_media,
                'statut_livraison' => $message->statut_livraison?->value,
                'envoye_at' => optional($message->envoye_at)?->toIso8601String(),
            ],
            'conversation_id' => $message->conversation_id,
            'orga_id' => $message->orga_id,
        ];
    }
}

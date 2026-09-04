<?php

namespace App\Events;

use App\Models\Conversation;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationMiseAJour implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Conversation $conversation) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('organisation.'.$this->conversation->orga_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'conversation.mise_a_jour';
    }

    public function broadcastWith(): array
    {
        $c = $this->conversation->loadMissing(['inbox', 'contact', 'agent', 'labels']);

        return [
            'conversation' => [
                'id' => $c->id,
                'uuid' => $c->uuid,
                'statut' => $c->statut?->value,
                'agent_id' => $c->agent_id,
                'non_lus_count' => $c->non_lus_count,
                'derniere_activite_at' => optional($c->derniere_activite_at)?->toIso8601String(),
                'archivee' => $c->archivee,
            ],
            'orga_id' => $c->orga_id,
        ];
    }
}

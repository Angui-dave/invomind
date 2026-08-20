<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Conversation
 */
class ConversationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'channel' => $this->channel,
            'contact_name' => $this->contact_name,
            'contact_handle' => $this->contact_handle,
            'thread_ref' => $this->thread_ref,
            'avatar_initials' => $this->avatar_initials,
            'client_id' => $this->client_id,
            'prospect_id' => $this->prospect_id,
            'unread_count' => $this->unread_count,
            'last_message_at' => $this->last_message_at,
            'archived' => $this->archived,
        ];
    }
}

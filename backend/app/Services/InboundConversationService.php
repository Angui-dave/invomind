<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\InboundMessage;
use Illuminate\Support\Str;

class InboundConversationService
{
    /**
     * Persist inbound webhook payload as inbox row + conversation thread.
     */
    public function ingest(
        string $organizationId,
        string $channel,
        string $handle,
        string $body,
        ?string $contactName = null,
        ?string $externalMessageId = null,
        ?string $sentAt = null,
        ?string $threadRef = null,
    ): void {
        $messageId = $externalMessageId ?: (string) Str::uuid();
        $timestamp = $sentAt ?: now()->toIso8601String();
        $displayName = filled($contactName) ? $contactName : $handle;

        InboundMessage::query()->updateOrCreate(
            ['id' => $messageId],
            [
                'organization_id' => $organizationId,
                'channel' => $channel,
                'handle' => $handle,
                'body' => $body,
                'sent_at' => $timestamp,
                'contact_name' => $contactName,
                'thread_ref' => $threadRef,
            ],
        );

        $conversation = Conversation::query()
            ->where('organization_id', $organizationId)
            ->where('channel', $channel)
            ->where('contact_handle', $handle)
            ->first();

        if (! $conversation) {
            $conversation = Conversation::create([
                'organization_id' => $organizationId,
                'channel' => $channel,
                'contact_name' => $displayName,
                'contact_handle' => $handle,
                'thread_ref' => $threadRef,
                'avatar_initials' => $this->initials($displayName),
                'unread_count' => 1,
                'last_message_at' => $timestamp,
                'archived' => false,
            ]);
        } else {
            $updates = [
                'contact_name' => $displayName,
                'unread_count' => ($conversation->unread_count ?? 0) + 1,
                'last_message_at' => $timestamp,
                'archived' => false,
            ];
            if (filled($threadRef) && ! filled($conversation->thread_ref)) {
                $updates['thread_ref'] = $threadRef;
            }
            $conversation->update($updates);
        }

        $exists = ConversationMessage::query()
            ->where('organization_id', $organizationId)
            ->where('conversation_id', $conversation->id)
            ->where('direction', 'inbound')
            ->where('body', $body)
            ->where('sent_at', '>=', now()->subMinute())
            ->exists();

        if (! $exists) {
            ConversationMessage::create([
                'organization_id' => $organizationId,
                'conversation_id' => $conversation->id,
                'direction' => 'inbound',
                'body' => $body,
                'sent_at' => now(),
                'status' => 'delivered',
            ]);
        }
    }

    private function initials(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $letters = '';
        foreach (array_slice($parts, 0, 2) as $part) {
            $letters .= mb_strtoupper(mb_substr($part, 0, 1));
        }

        return $letters !== '' ? $letters : '??';
    }
}

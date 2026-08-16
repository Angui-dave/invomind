"use client";

import { Search } from "lucide-react";
import { ChannelBadge } from "@/components/conversations/channel-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  conversationStampFr,
  type Conversation,
  type ConversationChannel,
  type ConversationMessage,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export type ChannelFilter = "all" | ConversationChannel;

type ConversationListProps = {
  conversations: Conversation[];
  messages: ConversationMessage[];
  selectedId: string | null;
  query: string;
  channelFilter: ChannelFilter;
  onQueryChange: (value: string) => void;
  onChannelFilterChange: (value: ChannelFilter) => void;
  onSelect: (id: string) => void;
  className?: string;
};

const FILTERS: { value: ChannelFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "whatsapp", label: "WA" },
  { value: "messenger", label: "FB" },
];

function previewFor(
  conversationId: string,
  messages: ConversationMessage[],
): string | undefined {
  let latest: ConversationMessage | undefined;
  for (const message of messages) {
    if (message.conversationId !== conversationId) continue;
    if (!latest || message.sentAt > latest.sentAt) latest = message;
  }
  return latest?.body;
}

export function ConversationList({
  conversations,
  messages,
  selectedId,
  query,
  channelFilter,
  onQueryChange,
  onChannelFilterChange,
  onSelect,
  className,
}: ConversationListProps) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="space-y-3 border-b border-line p-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink/40"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Rechercher…"
            className="h-9 pl-8"
            aria-label="Rechercher une conversation"
          />
        </div>
        <div
          className="flex gap-1 rounded-sm border border-line bg-muted/40 p-0.5"
          role="group"
          aria-label="Filtrer par canal"
        >
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => onChannelFilterChange(filter.value)}
              className={cn(
                "flex-1 rounded-sm px-2 py-1.5 text-xs font-medium transition-ledger",
                channelFilter === filter.value
                  ? "bg-paper text-ink shadow-sm"
                  : "text-ink/55 hover:text-ink",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto" role="list">
        {conversations.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-ink/55">
            Aucune conversation ne correspond à ces critères.
          </li>
        ) : (
          conversations.map((conversation) => {
            const preview = previewFor(conversation.id, messages);
            const active = selectedId === conversation.id;
            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-line px-3 py-3 text-left transition-ledger",
                    active
                      ? "bg-ledger/8"
                      : "hover:bg-muted/50",
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar size="default">
                      <AvatarFallback className="bg-muted text-xs text-ink">
                        {conversation.avatarInitials ??
                          conversation.contactName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -right-0.5 -bottom-0.5">
                      <ChannelBadge
                        channel={conversation.channel}
                        variant="dot"
                      />
                    </span>
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-ink">
                        {conversation.contactName}
                      </span>
                      <span className="num shrink-0 text-[11px] text-ink/45">
                        {conversationStampFr(conversation.lastMessageAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-ink/55">
                        {preview ?? "Aucun message"}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span className="num shrink-0 rounded-full bg-ledger px-1.5 py-0.5 text-[10px] font-semibold text-paper">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

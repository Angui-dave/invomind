"use client";

import { useEffect, useMemo, useRef } from "react";
import { ArrowLeft, UserRound } from "lucide-react";
import { ChannelBadge } from "@/components/conversations/channel-badge";
import {
  ConversationComposer,
  type SendPayload,
} from "@/components/conversations/conversation-composer";
import { MessageBubble } from "@/components/conversations/message-bubble";
import { Button } from "@/components/ui/button";
import { formatDateFr } from "@/lib/formatters";
import type { BusinessDocument } from "@/lib/documents";
import type { Conversation, ConversationMessage } from "@/lib/data/conversations";
import { todayIso } from "@/lib/date";
import { cn } from "@/lib/utils";

export type { SendPayload };

type ConversationThreadProps = {
  conversation: Conversation | null;
  messages: ConversationMessage[];
  invoices?: BusinessDocument[];
  onSend: (payload: SendPayload | string) => void | Promise<void>;
  onBack?: () => void;
  onOpenContact?: () => void;
  /** Optional slot for template picker (WhatsApp). */
  composeExtra?: React.ReactNode;
  className?: string;
};

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function dayLabel(isoDate: string): string {
  const today = todayIso();
  if (isoDate === today) return "Aujourd’hui";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isoDate === yesterday.toISOString().slice(0, 10)) return "Hier";
  return formatDateFr(isoDate);
}

export function ConversationThread({
  conversation,
  messages,
  invoices = [],
  onSend,
  onBack,
  onOpenContact,
  composeExtra,
  className,
}: ConversationThreadProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const conversationId = conversation?.id;

  const groups = useMemo(() => {
    const map = new Map<string, ConversationMessage[]>();
    for (const message of messages) {
      const key = dayKey(message.sentAt);
      const list = map.get(key) ?? [];
      list.push(message);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [messages]);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, conversationId]);

  if (!conversation) {
    return (
      <div
        className={cn(
          "flex h-full min-h-0 flex-col items-center justify-center bg-paper px-6 text-center",
          className,
        )}
      >
        <p className="font-serif text-lg font-semibold text-ink">
          Sélectionnez une conversation
        </p>
        <p className="mt-1 max-w-sm text-sm text-ink/55">
          Choisissez un échange WhatsApp ou Messenger pour afficher le fil et
          répondre au contact.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden bg-paper", className)}>
      <header className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2.5 sm:px-4">
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={onBack}
            aria-label="Retour à la liste"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ChannelBadge channel={conversation.channel} />
            <h2 className="truncate font-serif text-base font-semibold text-ink">
              {conversation.contactName}
            </h2>
          </div>
          <p className="truncate text-xs text-ink/50">
            {conversation.contactHandle}
          </p>
        </div>
        {onOpenContact && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="xl:hidden"
            onClick={onOpenContact}
          >
            <UserRound className="size-3.5" aria-hidden />
            Fiche
          </Button>
        )}
      </header>

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-4 sm:px-4"
      >
        {groups.map(([day, dayMessages]) => (
          <div key={day} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-[11px] font-medium text-ink/45" suppressHydrationWarning>
                {dayLabel(day)}
              </span>
              <div className="h-px flex-1 bg-line" />
            </div>
            {dayMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                contactName={conversation.contactName}
              />
            ))}
          </div>
        ))}
      </div>

      <ConversationComposer
        conversation={conversation}
        invoices={invoices}
        onSend={onSend}
        composeExtra={composeExtra}
      />
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Link2, Send, UserRound } from "lucide-react";
import { toast } from "sonner";
import { ChannelBadge } from "@/components/conversations/channel-badge";
import { MessageBubble } from "@/components/conversations/message-bubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  formatDateFr,
  latestOpenInvoiceToken,
  portalUrl,
  type BusinessDocument,
  type Conversation,
  type ConversationMessage,
} from "@/lib/mock-data";
import { todayIso } from "@/lib/date";
import { cn } from "@/lib/utils";

type ConversationThreadProps = {
  conversation: Conversation | null;
  messages: ConversationMessage[];
  invoices?: BusinessDocument[];
  onSend: (body: string) => void | Promise<void>;
  onBack?: () => void;
  onOpenContact?: () => void;
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
  className,
}: ConversationThreadProps) {
  const [draft, setDraft] = useState("");
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

  function handleSend() {
    const body = draft.trim();
    if (!body) {
      toast.error("Le message ne peut pas être vide");
      return;
    }
    onSend(body);
    setDraft("");
  }

  function insertPaymentLink() {
    if (!conversation?.clientId) {
      toast.error("Aucun client associé pour un lien de paiement");
      return;
    }
    const token = latestOpenInvoiceToken(conversation.clientId, invoices);
    if (!token) {
      toast.error("Aucune facture ouverte pour ce client");
      return;
    }
    const url = portalUrl(token);
    setDraft((prev) => (prev.trim() ? `${prev.trim()}\n${url}` : url));
    toast.success("Lien de paiement inséré");
  }

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
    <div className={cn("flex h-full min-h-0 flex-col bg-paper", className)}>
      <header className="flex items-center gap-2 border-b border-line px-3 py-2.5 sm:px-4">
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
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-4"
      >
        {groups.map(([day, dayMessages]) => (
          <div key={day} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-[11px] font-medium text-ink/45">
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

      <div className="border-t border-line p-3 sm:p-4">
        <div className="mb-2 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={insertPaymentLink}
            disabled={!conversation.clientId}
          >
            <Link2 className="size-3.5" aria-hidden />
            Insérer le lien de paiement
          </Button>
        </div>
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Écrire un message…"
            className="min-h-[44px] max-h-32 resize-none rounded-sm"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            type="button"
            className="h-10 shrink-0 bg-ledger text-paper hover:bg-ledger/90"
            onClick={handleSend}
            aria-label="Envoyer"
          >
            <Send className="size-4" aria-hidden />
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-ink/40">
          Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne
        </p>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ContactPanel } from "@/components/conversations/contact-panel";
import {
  ConversationList,
  type ChannelFilter,
} from "@/components/conversations/conversation-list";
import { ConversationThread } from "@/components/conversations/conversation-thread";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CONVERSATIONS,
  CONVERSATION_MESSAGES,
  TODAY,
  type Conversation,
  type ConversationMessage,
} from "@/lib/mock-data";
import type { InboundMessage } from "@/lib/webhooks/types";

function normalizeHandle(handle: string): string {
  return handle.replace(/[\s\-+]/g, "").toLowerCase();
}

function initialsFrom(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ConversationsPage() {
  const [conversations, setConversations] =
    useState<Conversation[]>(CONVERSATIONS);
  const [messages, setMessages] = useState<ConversationMessage[]>(
    CONVERSATION_MESSAGES,
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    CONVERSATIONS[0]?.id ?? null,
  );
  const [query, setQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [contactSheetOpen, setContactSheetOpen] = useState(false);

  const sinceRef = useRef<string>(new Date().toISOString());
  const seenInboundIds = useRef<Set<string>>(new Set());
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations
      .filter((c) => !c.archived)
      .filter((c) =>
        channelFilter === "all" ? true : c.channel === channelFilter,
      )
      .filter((c) => {
        if (!q) return true;
        return (
          c.contactName.toLowerCase().includes(q) ||
          c.contactHandle.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }, [conversations, query, channelFilter]);

  const selected =
    conversations.find((c) => c.id === selectedId) ?? null;

  const threadMessages = useMemo(
    () =>
      messages
        .filter((m) => m.conversationId === selectedId)
        .sort((a, b) => a.sentAt.localeCompare(b.sentAt)),
    [messages, selectedId],
  );

  function selectConversation(id: string) {
    setSelectedId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
    );
    setMobileShowThread(true);
  }

  async function handleSend(body: string) {
    if (!selectedId || !selected) return;

    const now = `${TODAY}T${new Date().toISOString().slice(11, 19)}`;
    const messageId = `msg_${Math.random().toString(36).slice(2, 8)}`;
    const message: ConversationMessage = {
      id: messageId,
      conversationId: selectedId,
      direction: "outbound",
      body,
      sentAt: now,
      status: "pending",
    };

    setMessages((prev) => [...prev, message]);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? { ...c, lastMessageAt: now, unreadCount: 0 }
          : c,
      ),
    );

    try {
      const res = await fetch("/api/conversations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedId,
          channel: selected.channel,
          to: selected.contactHandle,
          body,
        }),
      });
      const data = (await res.json()) as {
        status?: string;
        error?: string;
      };

      if (data.status === "success") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, status: "delivered" } : m,
          ),
        );
        toast.success("Message envoyé");
      } else if (data.status === "skipped") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, status: "sent" } : m,
          ),
        );
        toast.success("Message enregistré (webhook désactivé)");
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, status: "failed" } : m,
          ),
        );
        toast.error(
          typeof data.error === "string"
            ? data.error
            : "Échec de l’envoi du message",
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, status: "failed" } : m,
        ),
      );
      toast.error("Échec de l’envoi du message");
    }
  }

  const ingestInbound = useCallback((incoming: InboundMessage[]) => {
    if (incoming.length === 0) return;

    const fresh = incoming.filter((m) => !seenInboundIds.current.has(m.id));
    if (fresh.length === 0) return;

    for (const item of fresh) {
      seenInboundIds.current.add(item.id);
      if (item.sentAt > sinceRef.current) {
        sinceRef.current = item.sentAt;
      }
    }

    const prev = conversationsRef.current;
    const selected = selectedIdRef.current;
    const byHandle = new Map<string, Conversation>(
      prev.map((c) => [
        `${c.channel}:${normalizeHandle(c.contactHandle)}`,
        c,
      ]),
    );
    let next = [...prev];
    const newMessages: ConversationMessage[] = [];

    for (const item of fresh) {
      const key = `${item.channel}:${normalizeHandle(item.handle)}`;
      let conv = byHandle.get(key);

      if (!conv) {
        const name = item.contactName ?? item.handle;
        conv = {
          id: `conv_${Math.random().toString(36).slice(2, 8)}`,
          channel: item.channel,
          contactName: name,
          contactHandle:
            item.channel === "whatsapp" && !item.handle.startsWith("+")
              ? `+${item.handle}`
              : item.handle,
          avatarInitials: initialsFrom(name),
          unreadCount: 1,
          lastMessageAt: item.sentAt,
        };
        byHandle.set(key, conv);
        next = [conv, ...next];
      } else {
        next = next.map((c) =>
          c.id === conv!.id
            ? {
                ...c,
                lastMessageAt: item.sentAt,
                unreadCount:
                  c.id === selected ? c.unreadCount : c.unreadCount + 1,
              }
            : c,
        );
        conv = next.find((c) => c.id === conv!.id)!;
        byHandle.set(key, conv);
      }

      newMessages.push({
        id: item.id,
        conversationId: conv.id,
        direction: "inbound",
        body: item.body,
        sentAt: item.sentAt.slice(0, 19),
      });
    }

    setConversations(next);
    setMessages((prevMsgs) => {
      const existing = new Set(prevMsgs.map((m) => m.id));
      const toAdd = newMessages.filter((m) => !existing.has(m.id));
      return toAdd.length > 0 ? [...prevMsgs, ...toAdd] : prevMsgs;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (document.hidden) return;
      try {
        const res = await fetch(
          `/api/conversations/inbox?since=${encodeURIComponent(sinceRef.current)}`,
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { messages: InboundMessage[] };
        ingestInbound(data.messages ?? []);
      } catch {
        // Silent — polling is best-effort
      }
    }

    void poll();
    const timer = window.setInterval(() => void poll(), 10_000);
    const onVisibility = () => {
      if (!document.hidden) void poll();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ingestInbound]);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">
          Conversations
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Échanges WhatsApp et Messenger synchronisés avec le CRM
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-sm border border-line bg-paper">
        <div className="flex h-full lg:hidden">
          {!mobileShowThread || !selected ? (
            <ConversationList
              conversations={filtered}
              messages={messages}
              selectedId={selectedId}
              query={query}
              channelFilter={channelFilter}
              onQueryChange={setQuery}
              onChannelFilterChange={setChannelFilter}
              onSelect={selectConversation}
              className="w-full"
            />
          ) : (
            <ConversationThread
              conversation={selected}
              messages={threadMessages}
              onSend={handleSend}
              onBack={() => setMobileShowThread(false)}
              onOpenContact={() => setContactSheetOpen(true)}
              className="w-full"
            />
          )}
        </div>

        <div className="hidden h-full lg:grid lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_320px]">
          <ConversationList
            conversations={filtered}
            messages={messages}
            selectedId={selectedId}
            query={query}
            channelFilter={channelFilter}
            onQueryChange={setQuery}
            onChannelFilterChange={setChannelFilter}
            onSelect={selectConversation}
            className="border-r border-line"
          />
          <ConversationThread
            conversation={selected}
            messages={threadMessages}
            onSend={handleSend}
            onOpenContact={() => setContactSheetOpen(true)}
            className="xl:border-r xl:border-line"
          />
          <ContactPanel
            conversation={selected}
            className="hidden xl:flex"
          />
        </div>
      </div>

      <Sheet open={contactSheetOpen} onOpenChange={setContactSheetOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-sm">
          <SheetHeader className="sr-only">
            <SheetTitle>Fiche contact</SheetTitle>
          </SheetHeader>
          <ContactPanel conversation={selected} className="h-full" />
        </SheetContent>
      </Sheet>
    </div>
  );
}

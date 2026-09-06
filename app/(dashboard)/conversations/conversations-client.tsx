"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ContactPanel } from "@/components/conversations/contact-panel";
import {
  ConversationList,
  type ChannelFilter,
} from "@/components/conversations/conversation-list";
import { ConversationThread } from "@/components/conversations/conversation-thread";
import { TemplateSelector } from "@/components/conversations/template-selector";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  assignConversation,
  attachConversationLabel,
  detachConversationLabel,
  markConversationRead,
  refreshConversationsSnapshot,
  sendConversationMessage,
  updateConversationStatus,
} from "@/lib/actions/conversations";
import type { Client } from "@/lib/data/clients";
import {
  CHANNEL_LABELS,
  type Conversation,
  type ConversationLabel,
  type ConversationMessage,
} from "@/lib/data/conversations";
import type { Prospect } from "@/lib/data/settings";
import type { BusinessDocument } from "@/lib/documents";
import { todayIso } from "@/lib/date";
import { getEcho } from "@/lib/realtime/echo-client";
import type { InboundMessage } from "@/lib/webhooks/types";
import { Button } from "@/components/ui/button";

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

type ConversationsPageClientProps = {
  initialConversations: Conversation[];
  initialMessages: ConversationMessage[];
  clients?: Client[];
  prospects?: Prospect[];
  invoices?: BusinessDocument[];
  labels?: ConversationLabel[];
  organizationId?: string;
  currentUserId?: string;
  useRealtime?: boolean;
  channel?: ChannelFilter;
};

export function ConversationsPageClient({
  initialConversations,
  initialMessages,
  clients = [],
  prospects = [],
  invoices = [],
  labels = [],
  organizationId,
  currentUserId,
  useRealtime = false,
  channel = "all",
}: ConversationsPageClientProps) {
  const channelFilter = channel;

  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);
  const [messages, setMessages] =
    useState<ConversationMessage[]>(initialMessages);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [contactSheetOpen, setContactSheetOpen] = useState(false);

  const sinceRef = useRef<string>(new Date().toISOString());
  const seenInboundIds = useRef<Set<string>>(new Set());
  const conversationsRef = useRef(conversations);
  const selectedIdRef = useRef(selectedId);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

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

  useEffect(() => {
    setSelectedId((current) => {
      const visible = conversations
        .filter((c) => !c.archived)
        .filter((c) =>
          channelFilter === "all" ? true : c.channel === channelFilter,
        )
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
      if (visible.length === 0) return null;
      if (current && visible.some((c) => c.id === current)) return current;
      return visible[0].id;
    });
  }, [channelFilter, conversations]);

  useEffect(() => {
    setMobileShowThread(false);
  }, [channelFilter]);

  const selected = filtered.find((c) => c.id === selectedId) ?? null;

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
    if (useRealtime) {
      void markConversationRead(id);
    }
  }

  async function handleSend(
    payload:
      | string
      | {
          body: string;
          contentType?: "texte" | "image" | "fichier" | "audio" | "video" | "modele";
          mediaUrl?: string;
          templatePayload?: string;
        },
  ) {
    if (!selectedId || !selected) return;

    const normalized =
      typeof payload === "string"
        ? { body: payload, contentType: "texte" as const }
        : payload;
    const body = normalized.body.trim();
    const contentType = normalized.contentType ?? "texte";
    const mediaUrl = normalized.mediaUrl;
    const templatePayload = normalized.templatePayload;

    const now = `${todayIso()}T${new Date().toISOString().slice(11, 19)}`;
    const messageId = `msg_${Math.random().toString(36).slice(2, 8)}`;
    const message: ConversationMessage = {
      id: messageId,
      conversationId: selectedId,
      direction: "outbound",
      body,
      sentAt: now,
      status: "pending",
      contentType,
      mediaUrl,
    };

    setMessages((prev) => [...prev, message]);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? { ...c, lastMessageAt: now, unreadCount: 0 }
          : c,
      ),
    );

    if (useRealtime) {
      const result = await sendConversationMessage({
        conversationId: selectedId,
        body: contentType === "modele" ? (templatePayload ?? body) : body,
        contentType,
        mediaUrl: mediaUrl ?? null,
        templatePayload,
      });
      if (result.ok && result.message) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...result.message!, status: result.message!.status ?? "sent" }
              : m,
          ),
        );
        toast.success("Message envoyé");
      } else if (!result.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, status: "failed" } : m,
          ),
        );
        toast.error(result.error);
      }
      return;
    }

    try {
      const res = await fetch("/api/conversations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedId,
          channel: selected.channel,
          to: selected.contactHandle,
          body,
          ...(selected.threadRef ? { threadRef: selected.threadRef } : {}),
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

  async function handleStatusChange(
    status: NonNullable<Conversation["status"]>,
  ) {
    if (!selectedId || !useRealtime) return;
    const result = await updateConversationStatus({
      conversationId: selectedId,
      status,
    });
    if (result.ok) {
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, status } : c)),
      );
      toast.success("Statut mis à jour");
    } else {
      toast.error(result.error);
    }
  }

  async function handleAssignToggle() {
    if (!selectedId || !useRealtime || !currentUserId) return;
    const assignToMe = selected?.agentId !== currentUserId;
    const result = await assignConversation({
      conversationId: selectedId,
      agentId: assignToMe ? currentUserId : null,
    });
    if (result.ok) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? { ...c, agentId: assignToMe ? currentUserId : undefined }
            : c,
        ),
      );
      toast.success(assignToMe ? "Conversation assignée" : "Assignation retirée");
    } else {
      toast.error(result.error);
    }
  }

  async function handleToggleLabel(label: ConversationLabel) {
    if (!selectedId || !useRealtime) return;
    const attached = selected?.labels?.some((l) => l.id === label.id);
    const result = attached
      ? await detachConversationLabel({
          conversationId: selectedId,
          labelId: label.id,
        })
      : await attachConversationLabel({
          conversationId: selectedId,
          labelId: label.id,
        });
    if (result.ok) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== selectedId) return c;
          const current = c.labels ?? [];
          return {
            ...c,
            labels: attached
              ? current.filter((l) => l.id !== label.id)
              : [...current, label],
          };
        }),
      );
    } else {
      toast.error(result.error);
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
          ...(item.threadRef ? { threadRef: item.threadRef } : {}),
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
                ...(item.threadRef && !c.threadRef
                  ? { threadRef: item.threadRef }
                  : {}),
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

  // Mock-mode polling fallback
  useEffect(() => {
    if (useRealtime) return;
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
  }, [ingestInbound, useRealtime]);

  // Laravel Reverb realtime
  useEffect(() => {
    if (!useRealtime || !organizationId) return;

    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`organisation.${organizationId}`);

    channel.listen(".message.nouveau", (payload: {
      message?: {
        id: string | number;
        conversation_id: string | number;
        direction?: string;
        contenu?: string;
        type_contenu?: string;
        url_media?: string;
        envoye_at?: string;
        statut_livraison?: string;
      };
      conversation_id?: string | number;
    }) => {
      const msg = payload.message;
      if (!msg) return;
      const conversationId = String(msg.conversation_id ?? payload.conversation_id);
      const direction =
        msg.direction === "entrant" || msg.direction === "inbound"
          ? "inbound"
          : "outbound";
      const statusMap: Record<string, ConversationMessage["status"]> = {
        en_attente: "pending",
        envoye: "sent",
        livre: "delivered",
        lu: "read",
        echec: "failed",
      };
      const mapped: ConversationMessage = {
        id: String(msg.id),
        conversationId,
        direction,
        body: String(msg.contenu ?? ""),
        sentAt: String(msg.envoye_at ?? new Date().toISOString()).slice(0, 19),
        status: msg.statut_livraison
          ? statusMap[msg.statut_livraison]
          : undefined,
        contentType: msg.type_contenu ? String(msg.type_contenu) : undefined,
        mediaUrl: msg.url_media ? String(msg.url_media) : undefined,
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === mapped.id)) {
          return prev.map((m) =>
            m.id === mapped.id
              ? {
                  ...m,
                  ...mapped,
                  // Prefer newer delivery status when updating existing message
                  status: mapped.status ?? m.status,
                }
              : m,
          );
        }
        // Also match optimistic temp messages by body+outbound pending
        const optimisticIdx = prev.findIndex(
          (m) =>
            m.id.startsWith("msg_") &&
            m.conversationId === conversationId &&
            m.direction === "outbound" &&
            m.body === mapped.body &&
            (m.status === "pending" || m.status === "sent"),
        );
        if (optimisticIdx >= 0) {
          return prev.map((m, i) => (i === optimisticIdx ? mapped : m));
        }
        return [...prev, mapped];
      });

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conversationId);
        if (!exists) {
          // Soft refresh list by bumping activity if conversation unknown
          return prev;
        }
        return prev
          .map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  lastMessageAt: mapped.sentAt,
                  unreadCount:
                    direction === "inbound" &&
                    selectedIdRef.current !== conversationId
                      ? c.unreadCount + 1
                      : c.unreadCount,
                }
              : c,
          )
          .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
      });
    });

    channel.listen(".conversation.mise_a_jour", (payload: {
      conversation?: {
        id: string | number;
        statut?: string;
        agent_id?: string | number | null;
        non_lus_count?: number;
        derniere_activite_at?: string;
        archivee?: boolean;
      };
    }) => {
      const c = payload.conversation;
      if (!c) return;
      const statusMap: Record<string, Conversation["status"]> = {
        ouverte: "open",
        en_attente: "pending",
        resolue: "resolved",
      };
      setConversations((prev) =>
        prev.map((row) =>
          row.id === String(c.id)
            ? {
                ...row,
                status: c.statut ? statusMap[c.statut] : row.status,
                agentId:
                  c.agent_id != null ? String(c.agent_id) : row.agentId,
                unreadCount:
                  c.non_lus_count != null ? Number(c.non_lus_count) : row.unreadCount,
                lastMessageAt: c.derniere_activite_at
                  ? String(c.derniere_activite_at)
                  : row.lastMessageAt,
                archived: c.archivee ?? row.archived,
              }
            : row,
        ),
      );
    });

    // Fallback: soft-refresh conversations/messages if the socket drops
    const fallback = window.setInterval(() => {
      void refreshConversationsSnapshot().then((result) => {
        if (!result.ok) return;
        setConversations(result.conversations);
        setMessages(result.messages);
        sinceRef.current = new Date().toISOString();
      });
    }, 60_000);

    return () => {
      echo.leave(`organisation.${organizationId}`);
      window.clearInterval(fallback);
    };
  }, [organizationId, useRealtime]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
        <div>
          <p className="text-sm text-ink/60">
            {channelFilter === "all"
              ? "Échanges WhatsApp, Messenger, Instagram et TikTok synchronisés avec le CRM"
              : `${filtered.length} conversation${filtered.length > 1 ? "s" : ""} · ${CHANNEL_LABELS[channelFilter]}`}
          </p>
        </div>
        {selected && useRealtime ? (
          <div className="flex flex-wrap items-center gap-2">
            {labels.map((l) => {
              const active = selected.labels?.some((x) => x.id === l.id);
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => void handleToggleLabel(l)}
                  className="rounded-full px-2 py-0.5 text-xs font-medium text-white transition opacity-90 hover:opacity-100"
                  style={{
                    backgroundColor: l.color,
                    outline: active ? "2px solid currentColor" : undefined,
                    opacity: active ? 1 : 0.45,
                  }}
                >
                  {l.name}
                </button>
              );
            })}
            {currentUserId ? (
              <Button
                size="sm"
                variant={selected.agentId === currentUserId ? "default" : "outline"}
                onClick={() => void handleAssignToggle()}
              >
                {selected.agentId === currentUserId
                  ? "Me désassigner"
                  : "M’assigner"}
              </Button>
            ) : null}
            <Button
              size="sm"
              variant={selected.status === "open" ? "default" : "outline"}
              onClick={() => void handleStatusChange("open")}
            >
              Ouverte
            </Button>
            <Button
              size="sm"
              variant={selected.status === "pending" ? "default" : "outline"}
              onClick={() => void handleStatusChange("pending")}
            >
              En attente
            </Button>
            <Button
              size="sm"
              variant={selected.status === "resolved" ? "default" : "outline"}
              onClick={() => void handleStatusChange("resolved")}
            >
              Résolue
            </Button>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-paper">
        <div className="flex h-full min-h-0 lg:hidden">
          {!mobileShowThread || !selected ? (
            <ConversationList
              conversations={filtered}
              messages={messages}
              selectedId={selectedId}
              query={query}
              onQueryChange={setQuery}
              onSelect={selectConversation}
              className="w-full"
            />
          ) : (
            <ConversationThread
              key={selected?.id ?? "none"}
              conversation={selected}
              messages={threadMessages}
              invoices={invoices}
              onSend={handleSend}
              onBack={() => setMobileShowThread(false)}
              onOpenContact={() => setContactSheetOpen(true)}
              composeExtra={
                <TemplateSelector
                  inboxId={selected?.inboxId}
                  channel={selected?.channel}
                  onSelect={(p) => void handleSend(p)}
                />
              }
              className="w-full"
            />
          )}
        </div>

        <div className="hidden h-full min-h-0 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_240px]">
          <ConversationList
            conversations={filtered}
            messages={messages}
            selectedId={selectedId}
            query={query}
            onQueryChange={setQuery}
            onSelect={selectConversation}
            className="border-r border-line"
          />
          <ConversationThread
            key={selected?.id ?? "none-desktop"}
            conversation={selected}
            messages={threadMessages}
            invoices={invoices}
            onSend={handleSend}
            composeExtra={
              <TemplateSelector
                inboxId={selected?.inboxId}
                channel={selected?.channel}
                onSelect={(p) => void handleSend(p)}
              />
            }
            onOpenContact={() => setContactSheetOpen(true)}
            className="xl:border-r xl:border-line"
          />
          <ContactPanel
            conversation={selected}
            clients={clients}
            prospects={prospects}
            invoices={invoices}
            laravelEnabled={useRealtime}
            onClientLinked={(clientId) => {
              if (!selectedId || !clientId) return;
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === selectedId ? { ...c, clientId } : c,
                ),
              );
            }}
            className="hidden xl:flex"
          />
        </div>
      </div>

      <Sheet open={contactSheetOpen} onOpenChange={setContactSheetOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-sm">
          <SheetHeader className="sr-only">
            <SheetTitle>Fiche contact</SheetTitle>
          </SheetHeader>
          <ContactPanel
            conversation={selected}
            clients={clients}
            prospects={prospects}
            invoices={invoices}
            laravelEnabled={useRealtime}
            onClientLinked={(clientId) => {
              if (!selectedId || !clientId) return;
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === selectedId ? { ...c, clientId } : c,
                ),
              );
              setContactSheetOpen(false);
            }}
            className="h-full"
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

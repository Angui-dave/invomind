import "server-only";
import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { unwrapList } from "@/lib/laravel/pagination";
import {
  mapConversation,
  mapConversationMessage,
  mapInbox,
  mapLabel,
} from "@/lib/laravel/mappers";
import { tenantStore } from "@/lib/mock/store";
import type {
  Conversation,
  ConversationLabel,
  ConversationMessage,
} from "@/lib/data/conversations";

function calcUnreadLocal(conversations: Conversation[]): number {
  return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
}

export async function listConversations(): Promise<Conversation[]> {
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    const token = (await readSessionCookie())?.accessToken;
    const rows = unwrapList(
      await laravelRequest<unknown>("/conversations", {
        token,
        organizationId: session.organizationId,
      }),
    );
    return rows
      .map(mapConversation)
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }
  const store = await tenantStore();
  return [...store.conversations].sort((a, b) =>
    b.lastMessageAt.localeCompare(a.lastMessageAt),
  );
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    const token = (await readSessionCookie())?.accessToken;
    const row = await laravelRequest<unknown>(`/conversations/${id}`, {
      token,
      organizationId: session.organizationId,
    });
    return mapConversation(row);
  }
  const store = await tenantStore();
  return store.conversations.find((c) => c.id === id) ?? null;
}

export async function getMessages(
  conversationId?: string,
): Promise<ConversationMessage[]> {
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    if (!conversationId) {
      // Load messages for all conversations (used by initial page hydrate).
      const conversations = await listConversations();
      const token = (await readSessionCookie())?.accessToken;
      const batches = await Promise.all(
        conversations.map(async (c) => {
          const rows = unwrapList(
            await laravelRequest<unknown>(`/conversations/${c.id}/messages`, {
              token,
              organizationId: session.organizationId,
            }),
          );
          return rows.map(mapConversationMessage);
        }),
      );
      return batches.flat();
    }
    const token = (await readSessionCookie())?.accessToken;
    const rows = unwrapList(
      await laravelRequest<unknown>(
        `/conversations/${conversationId}/messages`,
        {
          token,
          organizationId: session.organizationId,
        },
      ),
    );
    return rows.map(mapConversationMessage);
  }
  const store = await tenantStore();
  const msgs = store.messages;
  if (!conversationId) return [...msgs];
  return msgs.filter((m) => m.conversationId === conversationId);
}

export async function listAllMessages(): Promise<ConversationMessage[]> {
  return getMessages();
}

export async function unreadTotal(): Promise<number> {
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    try {
      const token = (await readSessionCookie())?.accessToken;
      const res = await laravelRequest<{ total?: number }>(
        "/conversations/unread-total",
        {
          token,
          organizationId: session.organizationId,
        },
      );
      return Number(res.total ?? 0);
    } catch {
      return 0;
    }
  }
  const store = await tenantStore();
  return calcUnreadLocal(store.conversations);
}

export async function listInboxes() {
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    const token = (await readSessionCookie())?.accessToken;
    const rows = unwrapList(
      await laravelRequest<unknown>("/inboxes", {
        token,
        organizationId: session.organizationId,
      }),
    );
    return rows.map(mapInbox);
  }
  return [];
}

export async function listLabels(): Promise<ConversationLabel[]> {
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    const token = (await readSessionCookie())?.accessToken;
    const rows = unwrapList(
      await laravelRequest<unknown>("/labels", {
        token,
        organizationId: session.organizationId,
      }),
    );
    return rows.map(mapLabel);
  }
  return [];
}

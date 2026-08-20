import "server-only";
import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { mapConversation, mapConversationMessage } from "@/lib/laravel/mappers";
import { tenantStore } from "@/lib/mock/store";
import type {
  Conversation,
  ConversationMessage,
} from "@/lib/data/conversations";
import { unreadTotal as calcUnread } from "@/lib/data/conversations";

export async function listConversations(): Promise<Conversation[]> {
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    const token = (await readSessionCookie())?.accessToken;
    const rows = await laravelRequest<unknown[]>("/conversations", {
      token,
      organizationId: session.organizationId,
    });
    return rows
      .map(mapConversation)
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }
  const store = await tenantStore();
  return [...store.conversations].sort((a, b) =>
    b.lastMessageAt.localeCompare(a.lastMessageAt),
  );
}

export async function getMessages(
  conversationId?: string,
): Promise<ConversationMessage[]> {
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    const token = (await readSessionCookie())?.accessToken;
    const rows = await laravelRequest<unknown[]>("/conversations/messages", {
      token,
      organizationId: session.organizationId,
    });
    const mapped = rows.map(mapConversationMessage);
    if (!conversationId) return mapped;
    return mapped.filter((m) => m.conversationId === conversationId);
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
  if (isLaravelApiEnabled()) {
    const conversations = await listConversations();
    return calcUnread(conversations);
  }
  await verifySession();
  const store = await tenantStore();
  return calcUnread(store.conversations);
}

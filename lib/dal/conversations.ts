import "server-only";
import { verifySession } from "@/lib/dal/session";
import { tenantStore } from "@/lib/mock/store";
import type {
  Conversation,
  ConversationMessage,
} from "@/lib/data/conversations";
import { unreadTotal as calcUnread } from "@/lib/data/conversations";

export async function listConversations(): Promise<Conversation[]> {
  await verifySession();
  const store = await tenantStore();
  return [...store.conversations].sort((a, b) =>
    b.lastMessageAt.localeCompare(a.lastMessageAt),
  );
}

export async function getMessages(
  conversationId?: string,
): Promise<ConversationMessage[]> {
  await verifySession();
  const store = await tenantStore();
  const msgs = store.messages;
  if (!conversationId) return [...msgs];
  return msgs.filter((m) => m.conversationId === conversationId);
}

export async function listAllMessages(): Promise<ConversationMessage[]> {
  return getMessages();
}

export async function unreadTotal(): Promise<number> {
  await verifySession();
  const store = await tenantStore();
  return calcUnread(store.conversations);
}

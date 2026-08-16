import type { InboundMessage } from "@/lib/webhooks/types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function secondsToIso(seconds: string | number | undefined): string {
  if (seconds === undefined) return new Date().toISOString();
  const n = typeof seconds === "string" ? Number(seconds) : seconds;
  if (!Number.isFinite(n)) return new Date().toISOString();
  // TikTok may send seconds or milliseconds
  const ms = n > 1e12 ? n : n * 1000;
  return new Date(ms).toISOString();
}

function parseContent(content: unknown): UnknownRecord | null {
  if (isRecord(content)) return content;
  if (typeof content !== "string" || content.length === 0) return null;
  try {
    const parsed: unknown = JSON.parse(content);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function extractText(content: UnknownRecord): string | undefined {
  const direct = asString(content.text);
  if (direct) return direct;

  const message = content.message;
  if (isRecord(message)) {
    const nested = asString(message.text);
    if (nested) return nested;
  }

  const textObj = content.text;
  if (isRecord(textObj)) {
    return asString(textObj.body) ?? asString(textObj.text);
  }

  return undefined;
}

/**
 * Normalize a TikTok Business Messaging webhook body into inbound text messages.
 * Envelope: { client_key, event, create_time, user_openid, content }
 * where content is a serialized JSON string (or already-parsed object).
 */
export function normalizeTikTokPayload(payload: unknown): InboundMessage[] {
  if (!isRecord(payload)) return [];
  if (asString(payload.event) !== "receive_message") return [];

  const content = parseContent(payload.content);
  if (!content) return [];

  const body = extractText(content);
  if (!body) return [];

  const id =
    asString(content.message_id) ??
    asString(content.msg_id) ??
    asString(content.id);
  if (!id) return [];

  const handle =
    asString(content.sender) ??
    asString(content.user_openid) ??
    asString(payload.user_openid);
  if (!handle) return [];

  const threadRef =
    asString(content.conversation_id) ?? asString(content.conversationId);

  const sentAt = secondsToIso(
    (content.timestamp as string | number | undefined) ??
      (payload.create_time as string | number | undefined),
  );

  return [
    {
      id,
      channel: "tiktok",
      handle,
      body,
      sentAt,
      ...(threadRef ? { threadRef } : {}),
    },
  ];
}

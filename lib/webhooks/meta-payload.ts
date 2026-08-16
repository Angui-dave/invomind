import type { ConversationChannel } from "@/lib/data/conversations";
import type { InboundMessage } from "@/lib/webhooks/types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function secondsToIso(seconds: string | number): string {
  const n = typeof seconds === "string" ? Number(seconds) : seconds;
  if (!Number.isFinite(n)) return new Date().toISOString();
  return new Date(n * 1000).toISOString();
}

function millisToIso(ms: string | number): string {
  const n = typeof ms === "string" ? Number(ms) : ms;
  if (!Number.isFinite(n)) return new Date().toISOString();
  return new Date(n).toISOString();
}

function detectChannel(payload: UnknownRecord): ConversationChannel | null {
  const object = asString(payload.object);
  if (object === "whatsapp_business_account") return "whatsapp";
  if (object === "page") return "messenger";
  if (object === "instagram") return "instagram";

  const entry = Array.isArray(payload.entry) ? payload.entry[0] : null;
  if (isRecord(entry)) {
    if (Array.isArray(entry.changes)) return "whatsapp";
    if (Array.isArray(entry.messaging)) return "messenger";
  }
  return null;
}

function parseWhatsApp(payload: UnknownRecord): InboundMessage[] {
  const messages: InboundMessage[] = [];
  const entries = Array.isArray(payload.entry) ? payload.entry : [];

  for (const entry of entries) {
    if (!isRecord(entry)) continue;
    const changes = Array.isArray(entry.changes) ? entry.changes : [];
    for (const change of changes) {
      if (!isRecord(change)) continue;
      const value = change.value;
      if (!isRecord(value)) continue;

      const contacts = Array.isArray(value.contacts) ? value.contacts : [];
      const contactName = (() => {
        const first = contacts[0];
        if (!isRecord(first)) return undefined;
        const profile = first.profile;
        if (!isRecord(profile)) return undefined;
        return asString(profile.name);
      })();

      const list = Array.isArray(value.messages) ? value.messages : [];
      for (const msg of list) {
        if (!isRecord(msg)) continue;
        if (asString(msg.type) !== "text") continue;
        const text = msg.text;
        if (!isRecord(text)) continue;
        const body = asString(text.body);
        const from = asString(msg.from);
        const id = asString(msg.id);
        if (!body || !from || !id) continue;
        messages.push({
          id,
          channel: "whatsapp",
          handle: from.startsWith("+") ? from : `+${from}`,
          contactName,
          body,
          sentAt: secondsToIso(msg.timestamp as string | number),
        });
      }
    }
  }

  return messages;
}

/** Shared Messenger / Instagram messaging[] parser (text only, skip echoes). */
function parseMessagingEvents(
  payload: UnknownRecord,
  channel: "messenger" | "instagram",
): InboundMessage[] {
  const messages: InboundMessage[] = [];
  const entries = Array.isArray(payload.entry) ? payload.entry : [];

  for (const entry of entries) {
    if (!isRecord(entry)) continue;
    const events = Array.isArray(entry.messaging) ? entry.messaging : [];
    for (const event of events) {
      if (!isRecord(event)) continue;
      const message = event.message;
      if (!isRecord(message)) continue;
      if (message.is_echo === true) continue;
      const body = asString(message.text);
      const id = asString(message.mid);
      const sender = event.sender;
      if (!isRecord(sender)) continue;
      const handle = asString(sender.id);
      if (!body || !id || !handle) continue;
      messages.push({
        id,
        channel,
        handle,
        body,
        sentAt: millisToIso(event.timestamp as string | number),
      });
    }
  }

  return messages;
}

/** Normalize a Meta webhook JSON body into inbound text messages. */
export function normalizeMetaPayload(payload: unknown): InboundMessage[] {
  if (!isRecord(payload)) return [];
  const channel = detectChannel(payload);
  if (channel === "whatsapp") return parseWhatsApp(payload);
  if (channel === "messenger") return parseMessagingEvents(payload, "messenger");
  if (channel === "instagram") return parseMessagingEvents(payload, "instagram");
  return [];
}

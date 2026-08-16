import { normalizeMetaPayload } from "@/lib/webhooks/meta-payload";
import { verifyMetaSignature } from "@/lib/webhooks/signature";
import {
  appendInbound,
  resolveOrgByExternalId,
} from "@/lib/webhooks/store";
import type { ConversationChannel } from "@/lib/data/conversations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function extractEntryIds(payload: unknown): string[] {
  if (typeof payload !== "object" || payload === null) return [];
  const entry = (payload as { entry?: unknown }).entry;
  if (!Array.isArray(entry)) return [];
  const ids: string[] = [];
  for (const item of entry) {
    if (typeof item !== "object" || item === null) continue;
    const id = (item as { id?: unknown }).id;
    if (typeof id === "string" && id.length > 0) ids.push(id);
  }
  return ids;
}

function channelsForObject(payload: unknown): ConversationChannel[] {
  if (typeof payload !== "object" || payload === null) {
    return ["whatsapp", "messenger", "instagram"];
  }
  const object = (payload as { object?: unknown }).object;
  if (object === "whatsapp_business_account") return ["whatsapp"];
  if (object === "page") return ["messenger"];
  if (object === "instagram") return ["instagram"];
  return ["whatsapp", "messenger", "instagram"];
}

/** Meta webhook verification challenge. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const expected = process.env.META_VERIFY_TOKEN;

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Forbidden", { status: 403 });
}

/** Receive inbound WhatsApp / Messenger / Instagram events from Meta. */
export async function POST(request: Request) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    return new Response("META_APP_SECRET non configuré", { status: 401 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(appSecret, rawBody, signature)) {
    return new Response("Signature invalide", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("JSON invalide", { status: 400 });
  }

  const messages = normalizeMetaPayload(payload);
  if (messages.length > 0) {
    const channels = channelsForObject(payload);
    const entryIds = extractEntryIds(payload);
    let organizationId: string | null = null;
    for (const externalId of entryIds) {
      organizationId = await resolveOrgByExternalId(channels, externalId);
      if (organizationId) break;
    }

    if (organizationId) {
      await appendInbound(organizationId, messages);
    }
  }

  // Always 200 after a valid signature so Meta does not retry.
  return new Response("EVENT_RECEIVED", { status: 200 });
}

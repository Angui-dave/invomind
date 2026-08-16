import { normalizeMetaPayload } from "@/lib/webhooks/meta-payload";
import { verifyMetaSignature } from "@/lib/webhooks/signature";
import { appendInbound } from "@/lib/webhooks/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

/** Receive inbound WhatsApp / Messenger events from Meta. */
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
    appendInbound(messages);
  }

  // Always 200 after a valid signature so Meta does not retry.
  return new Response("EVENT_RECEIVED", { status: 200 });
}

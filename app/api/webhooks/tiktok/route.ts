import { verifyTikTokSignature } from "@/lib/webhooks/signature";
import { appendInbound } from "@/lib/webhooks/store";
import { normalizeTikTokPayload } from "@/lib/webhooks/tiktok-payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Receive inbound TikTok Business Messaging events. */
export async function POST(request: Request) {
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientSecret) {
    return new Response("TIKTOK_CLIENT_SECRET non configuré", { status: 401 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("tiktok-signature");

  if (!verifyTikTokSignature(clientSecret, rawBody, signature)) {
    return new Response("Signature invalide", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("JSON invalide", { status: 400 });
  }

  const expectedKey = process.env.TIKTOK_CLIENT_KEY;
  if (expectedKey) {
    const clientKey =
      typeof payload === "object" &&
      payload !== null &&
      "client_key" in payload &&
      typeof (payload as { client_key: unknown }).client_key === "string"
        ? (payload as { client_key: string }).client_key
        : null;
    if (clientKey !== expectedKey) {
      return new Response("client_key invalide", { status: 401 });
    }
  }

  const messages = normalizeTikTokPayload(payload);
  if (messages.length > 0) {
    appendInbound(messages);
  }

  // Always 200 after a valid signature so TikTok does not retry for up to 72h.
  return new Response("EVENT_RECEIVED", { status: 200 });
}

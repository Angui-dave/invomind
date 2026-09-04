import { isConversationChannel } from "@/lib/data/conversations";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { signPayload } from "@/lib/webhooks/signature";
import { getConfig, logDelivery } from "@/lib/webhooks/store";
import type { DeliveryAttempt, SendMessagePayload } from "@/lib/webhooks/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseBody(data: unknown): SendMessagePayload | null {
  if (typeof data !== "object" || data === null) return null;
  const obj = data as Record<string, unknown>;
  const conversationId =
    typeof obj.conversationId === "string" ? obj.conversationId.trim() : "";
  const to = typeof obj.to === "string" ? obj.to.trim() : "";
  const body = typeof obj.body === "string" ? obj.body.trim() : "";
  const threadRef =
    typeof obj.threadRef === "string" && obj.threadRef.trim().length > 0
      ? obj.threadRef.trim()
      : undefined;
  if (!conversationId || !to || !body || !isConversationChannel(obj.channel)) {
    return null;
  }
  return {
    conversationId,
    channel: obj.channel,
    to,
    body,
    ...(threadRef ? { threadRef } : {}),
  };
}

/**
 * Legacy mock outbound send. In Laravel mode use server action
 * `sendConversationMessage` → POST /conversations/{id}/messages.
 */
export async function POST(request: Request) {
  if (isLaravelApiEnabled()) {
    return Response.json(
      {
        error:
          "Utilisez sendConversationMessage (POST /conversations/{id}/messages).",
      },
      { status: 501 },
    );
  }

  const session = await verifySession();
  const organizationId = session.organizationId;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }

  const payload = parseBody(json);
  if (!payload) {
    return Response.json(
      {
        error:
          "Corps attendu : { conversationId, channel, to, body, threadRef? }",
      },
      { status: 400 },
    );
  }

  const config = await getConfig(organizationId);
  const deliveryId = crypto.randomUUID();
  const attemptedAt = new Date().toISOString();

  if (!config.url) {
    const attempt: DeliveryAttempt = {
      id: deliveryId,
      organizationId,
      conversationId: payload.conversationId,
      channel: payload.channel,
      to: payload.to,
      status: "skipped",
      httpStatus: null,
      error: "Webhook URL non configurée",
      attemptedAt,
    };
    await logDelivery(attempt);
    return Response.json({ ok: true, skipped: true, deliveryId });
  }

  const body = JSON.stringify({
    event: "message.outbound",
    organizationId,
    ...payload,
    attemptedAt,
  });
  const signature = config.secret
    ? signPayload(body, config.secret)
    : undefined;

  try {
    const res = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(signature ? { "X-InvoMind-Signature": signature } : {}),
      },
      body,
    });
    const attempt: DeliveryAttempt = {
      id: deliveryId,
      organizationId,
      conversationId: payload.conversationId,
      channel: payload.channel,
      to: payload.to,
      status: res.ok ? "delivered" : "failed",
      httpStatus: res.status,
      error: res.ok ? null : await res.text().catch(() => "HTTP error"),
      attemptedAt,
    };
    await logDelivery(attempt);
    return Response.json({
      ok: res.ok,
      deliveryId,
      httpStatus: res.status,
    });
  } catch (e) {
    const attempt: DeliveryAttempt = {
      id: deliveryId,
      organizationId,
      conversationId: payload.conversationId,
      channel: payload.channel,
      to: payload.to,
      status: "failed",
      httpStatus: null,
      error: e instanceof Error ? e.message : "Network error",
      attemptedAt,
    };
    await logDelivery(attempt);
    return Response.json({ ok: false, deliveryId, error: attempt.error }, {
      status: 502,
    });
  }
}

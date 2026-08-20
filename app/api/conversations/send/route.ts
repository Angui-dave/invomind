import { readSessionCookie } from "@/lib/auth/session";
import { isConversationChannel } from "@/lib/data/conversations";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { mapConversationSendStatus } from "@/lib/laravel/mappers";
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

export async function POST(request: Request) {
  const session = await verifySession();
  const organizationId = session.organizationId;
  const token = (await readSessionCookie())?.accessToken;

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

  if (isLaravelApiEnabled()) {
    const response = await laravelRequest<unknown>("/conversations/send", {
      method: "POST",
      token,
      organizationId,
      body: {
        conversation_id: payload.conversationId,
        channel: payload.channel,
        to: payload.to,
        body: payload.body,
        thread_ref: payload.threadRef,
      },
    });
    const normalized = mapConversationSendStatus(response);
    return Response.json({
      ...normalized,
      raw: response,
    });
  }

  const config = await getConfig(organizationId);
  const deliveryId = crypto.randomUUID();
  const attemptedAt = new Date().toISOString();

  if (!config.enabled || !config.url) {
    const attempt: Omit<DeliveryAttempt, "id"> & { id?: string } = {
      id: deliveryId,
      conversationId: payload.conversationId,
      channel: payload.channel,
      status: "skipped",
      attemptedAt,
      durationMs: 0,
    };
    await logDelivery(organizationId, attempt);
    return Response.json({
      status: "skipped",
      deliveredAt: attemptedAt,
    });
  }

  const eventBody = JSON.stringify({
    event: "message.send",
    deliveryId,
    conversationId: payload.conversationId,
    channel: payload.channel,
    to: payload.to,
    body: payload.body,
    ...(payload.threadRef ? { threadRef: payload.threadRef } : {}),
    sentAt: attemptedAt,
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = config.secret
    ? signPayload(config.secret, timestamp, eventBody)
    : "";

  const started = Date.now();
  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Invomind-Event": "message.send",
        "X-Invomind-Delivery": deliveryId,
        "X-Invomind-Timestamp": timestamp,
        ...(signature ? { "X-Invomind-Signature": signature } : {}),
      },
      body: eventBody,
      signal: AbortSignal.timeout(8000),
    });

    const durationMs = Date.now() - started;
    const ok = response.ok;
    await logDelivery(organizationId, {
      id: deliveryId,
      conversationId: payload.conversationId,
      channel: payload.channel,
      status: ok ? "success" : "failed",
      httpStatus: response.status,
      error: ok ? undefined : `HTTP ${response.status}`,
      attemptedAt,
      durationMs,
    });

    if (!ok) {
      return Response.json(
        {
          status: "failed",
          httpStatus: response.status,
          deliveredAt: attemptedAt,
          error: `Le webhook a répondu ${response.status}`,
        },
        { status: 502 },
      );
    }

    return Response.json({
      status: "success",
      httpStatus: response.status,
      deliveredAt: attemptedAt,
    });
  } catch (error) {
    const durationMs = Date.now() - started;
    const message =
      error instanceof Error ? error.message : "Erreur réseau inconnue";
    await logDelivery(organizationId, {
      id: deliveryId,
      conversationId: payload.conversationId,
      channel: payload.channel,
      status: "failed",
      error: message,
      attemptedAt,
      durationMs,
    });
    return Response.json(
      {
        status: "failed",
        deliveredAt: attemptedAt,
        error: message,
      },
      { status: 502 },
    );
  }
}

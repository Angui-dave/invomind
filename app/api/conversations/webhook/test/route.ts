import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { mapConversationSendStatus } from "@/lib/laravel/mappers";
import { mapTenantRoleToAppRole } from "@/lib/rbac/types";
import { isAdminTenant } from "@/lib/rbac/policy";
import { signPayload } from "@/lib/webhooks/signature";
import { getConfig, logDelivery } from "@/lib/webhooks/store";
import type { DeliveryAttempt } from "@/lib/webhooks/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await verifySession();
  if (!isAdminTenant(mapTenantRoleToAppRole(session.role))) {
    return Response.json({ error: "Non autorisé" }, { status: 403 });
  }

  const token = (await readSessionCookie())?.accessToken;
  const organizationId = session.organizationId;

  if (isLaravelApiEnabled()) {
    const response = await laravelRequest<unknown>("/conversations/webhook/test", {
      method: "POST",
      token,
      organizationId,
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
      conversationId: "webhook-test",
      channel: "whatsapp",
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
    event: "webhook.test",
    deliveryId,
    conversationId: "webhook-test",
    channel: "whatsapp",
    to: "+221770000000",
    body: "Message de test InvoMind",
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
        "X-Invomind-Event": "webhook.test",
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
      conversationId: "webhook-test",
      channel: "whatsapp",
      status: ok ? "success" : "failed",
      httpStatus: response.status,
      error: ok ? undefined : `HTTP ${response.status}`,
      attemptedAt,
      durationMs,
    });
    return Response.json({
      status: ok ? "success" : "failed",
      httpStatus: response.status,
      deliveredAt: attemptedAt,
      ...(ok ? {} : { error: `Le webhook a répondu ${response.status}` }),
    }, { status: ok ? 200 : 502 });
  } catch (error) {
    const durationMs = Date.now() - started;
    const message =
      error instanceof Error ? error.message : "Erreur réseau inconnue";
    await logDelivery(organizationId, {
      id: deliveryId,
      conversationId: "webhook-test",
      channel: "whatsapp",
      status: "failed",
      error: message,
      attemptedAt,
      durationMs,
    });
    return Response.json({ status: "failed", error: message }, { status: 502 });
  }
}

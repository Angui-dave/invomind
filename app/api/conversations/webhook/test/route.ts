import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { mapTenantRoleToAppRole } from "@/lib/rbac/types";
import { isAdminTenant } from "@/lib/rbac/policy";
import { signPayload } from "@/lib/webhooks/signature";
import { getConfig, logDelivery } from "@/lib/webhooks/store";
import type { DeliveryAttempt } from "@/lib/webhooks/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Legacy mock webhook test — unavailable in Laravel mode. */
export async function POST() {
  if (isLaravelApiEnabled()) {
    return Response.json(
      {
        error:
          "Test webhook legacy indisponible. Utilisez une boîte fake / sandbox.",
      },
      { status: 501 },
    );
  }

  const session = await verifySession();
  if (!isAdminTenant(mapTenantRoleToAppRole(session.role))) {
    return Response.json({ error: "Non autorisé" }, { status: 403 });
  }

  const organizationId = session.organizationId;
  const config = await getConfig(organizationId);
  const deliveryId = crypto.randomUUID();
  const attemptedAt = new Date().toISOString();

  if (!config.url) {
    return Response.json(
      { error: "Configurez d’abord l’URL du webhook" },
      { status: 422 },
    );
  }

  const body = JSON.stringify({
    event: "webhook.test",
    organizationId,
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
      conversationId: "test",
      channel: "whatsapp",
      to: "test",
      status: res.ok ? "delivered" : "failed",
      httpStatus: res.status,
      error: res.ok ? null : await res.text().catch(() => "HTTP error"),
      attemptedAt,
    };
    await logDelivery(attempt);
    return Response.json({ ok: res.ok, deliveryId, httpStatus: res.status });
  } catch (e) {
    const attempt: DeliveryAttempt = {
      id: deliveryId,
      organizationId,
      conversationId: "test",
      channel: "whatsapp",
      to: "test",
      status: "failed",
      httpStatus: null,
      error: e instanceof Error ? e.message : "Network error",
      attemptedAt,
    };
    await logDelivery(attempt);
    return Response.json({ ok: false, error: attempt.error }, { status: 502 });
  }
}

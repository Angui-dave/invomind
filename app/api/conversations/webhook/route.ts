import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { mapTenantRoleToAppRole } from "@/lib/rbac/types";
import { isAdminTenant } from "@/lib/rbac/policy";
import {
  getMaskedConfig,
  recentDeliveries,
  setConfig,
} from "@/lib/webhooks/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidWebhookUrl(url: string): boolean {
  if (!url) return true;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol === "https:") return true;
  if (
    parsed.protocol === "http:" &&
    (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
  ) {
    return true;
  }
  return false;
}

/**
 * Legacy mock outbound webhook config.
 * Laravel mode uses Inbox adapters — this endpoint is not available.
 */
export async function GET() {
  if (isLaravelApiEnabled()) {
    return Response.json(
      {
        error:
          "Webhook sortant legacy indisponible. Configurez les boîtes de réception (Inbox).",
      },
      { status: 501 },
    );
  }
  const session = await verifySession();
  if (!isAdminTenant(mapTenantRoleToAppRole(session.role))) {
    return Response.json({ error: "Non autorisé" }, { status: 403 });
  }
  const organizationId = session.organizationId;
  return Response.json({
    config: await getMaskedConfig(organizationId),
    deliveries: await recentDeliveries(organizationId),
  });
}

export async function PUT(request: Request) {
  if (isLaravelApiEnabled()) {
    return Response.json(
      {
        error:
          "Webhook sortant legacy indisponible. Configurez les boîtes de réception (Inbox).",
      },
      { status: 501 },
    );
  }
  const session = await verifySession();
  if (!isAdminTenant(mapTenantRoleToAppRole(session.role))) {
    return Response.json({ error: "Non autorisé" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }
  const obj = json as Record<string, unknown>;
  const url = typeof obj.url === "string" ? obj.url.trim() : "";
  const secret = typeof obj.secret === "string" ? obj.secret : "";
  if (!isValidWebhookUrl(url)) {
    return Response.json({ error: "URL webhook invalide" }, { status: 422 });
  }
  await setConfig(session.organizationId, { url, secret });
  return Response.json({
    config: await getMaskedConfig(session.organizationId),
  });
}

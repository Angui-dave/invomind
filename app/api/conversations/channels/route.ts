import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { mapTenantRoleToAppRole } from "@/lib/rbac/types";
import { isAdminTenant } from "@/lib/rbac/policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Legacy channel connections. Laravel mode uses GET/POST/DELETE /inboxes.
 */
export async function GET() {
  if (isLaravelApiEnabled()) {
    return Response.json(
      {
        error:
          "Channels legacy remplacés par /inboxes (voir InboxSettings).",
      },
      { status: 501 },
    );
  }
  const session = await verifySession();
  if (!isAdminTenant(mapTenantRoleToAppRole(session.role))) {
    return Response.json({ error: "Non autorisé" }, { status: 403 });
  }
  return Response.json([]);
}

export async function POST() {
  return Response.json(
    {
      error: isLaravelApiEnabled()
        ? "Utilisez POST /inboxes."
        : "Les connexions de canaux nécessitent l’API Laravel (Inbox).",
    },
    { status: 501 },
  );
}

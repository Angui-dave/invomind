import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { mapTenantRoleToAppRole } from "@/lib/rbac/types";
import { isAdminTenant } from "@/lib/rbac/policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Legacy channel delete — use DELETE /inboxes/{id} instead. */
export async function DELETE() {
  const session = await verifySession();
  if (!isAdminTenant(mapTenantRoleToAppRole(session.role))) {
    return Response.json({ error: "Non autorisé" }, { status: 403 });
  }
  return Response.json(
    {
      error: isLaravelApiEnabled()
        ? "Utilisez DELETE /inboxes/{id}."
        : "Non disponible en mode démo",
    },
    { status: 501 },
  );
}

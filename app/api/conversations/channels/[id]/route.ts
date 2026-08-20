import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { mapTenantRoleToAppRole } from "@/lib/rbac/types";
import { isAdminTenant } from "@/lib/rbac/policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await verifySession();
  if (!isAdminTenant(mapTenantRoleToAppRole(session.role))) {
    return Response.json({ error: "Non autorisé" }, { status: 403 });
  }
  if (!isLaravelApiEnabled()) {
    return Response.json({ error: "Non disponible en mode démo" }, { status: 501 });
  }

  const { id } = await context.params;
  const token = (await readSessionCookie())?.accessToken;
  await laravelRequest(`/conversations/channels/${id}`, {
    method: "DELETE",
    token,
    organizationId: session.organizationId,
  });
  return new Response(null, { status: 204 });
}

import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { unwrapList } from "@/lib/laravel/pagination";
import { mapTenantRoleToAppRole } from "@/lib/rbac/types";
import { isAdminTenant } from "@/lib/rbac/policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type ChannelConnectionDto = {
  id: string;
  channel: string;
  external_id: string;
  display_name: string | null;
  created_at?: string;
};

export async function GET() {
  const session = await verifySession();
  if (!isAdminTenant(mapTenantRoleToAppRole(session.role))) {
    return Response.json({ error: "Non autorisé" }, { status: 403 });
  }
  if (!isLaravelApiEnabled()) {
    return Response.json([]);
  }
  const token = (await readSessionCookie())?.accessToken;
  const payload = await laravelRequest<unknown>("/conversations/channels", {
    token,
    organizationId: session.organizationId,
  });
  return Response.json(unwrapList(payload));
}

export async function POST(request: Request) {
  const session = await verifySession();
  if (!isAdminTenant(mapTenantRoleToAppRole(session.role))) {
    return Response.json({ error: "Non autorisé" }, { status: 403 });
  }
  if (!isLaravelApiEnabled()) {
    return Response.json(
      { error: "Les connexions de canaux nécessitent l’API Laravel." },
      { status: 501 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }

  const token = (await readSessionCookie())?.accessToken;
  const created = await laravelRequest<ChannelConnectionDto>("/conversations/channels", {
    method: "POST",
    token,
    organizationId: session.organizationId,
    body: json,
  });
  return Response.json(created, { status: 201 });
}

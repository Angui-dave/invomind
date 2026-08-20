import "server-only";
import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { getAgentService, type AgentDto, type InvitationDto } from "@/lib/services/agent";
import type { TenantRole } from "@/lib/mock/central";

export async function listAgents(): Promise<AgentDto[]> {
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    const token = (await readSessionCookie())?.accessToken;
    const rows = await laravelRequest<Array<Record<string, unknown>>>("/agents", {
      token,
      organizationId: session.organizationId,
    });
    return rows.map(mapAgent);
  }
  return getAgentService().listAgents(session.organizationId);
}

export async function listPendingInvitations(): Promise<InvitationDto[]> {
  const session = await verifySession();
  if (!isLaravelApiEnabled()) {
    return [];
  }
  const token = (await readSessionCookie())?.accessToken;
  const rows = await laravelRequest<Array<Record<string, unknown>>>(
    "/organization/invitations",
    {
      token,
      organizationId: session.organizationId,
    },
  );
  return rows.map((row) => ({
    id: String(row.id ?? ""),
    email: String(row.email ?? ""),
    role: row.role === "admin" ? "admin" : "member",
    expiresAt: String(row.expires_at ?? ""),
  }));
}

function mapAgent(row: Record<string, unknown>): AgentDto {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    role: (String(row.role ?? "member") as TenantRole) || "member",
    status: row.status === "disabled" ? "disabled" : "active",
    createdAt: String(row.created_at ?? ""),
  };
}

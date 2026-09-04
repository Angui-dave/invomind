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
    try {
      const token = (await readSessionCookie())?.accessToken;
      const rows = await laravelRequest<Array<Record<string, unknown>>>("/agents", {
        token,
        organizationId: session.organizationId,
      });
      return rows.map(mapAgent);
    } catch (error) {
      console.error("listAgents failed", error);
      return [];
    }
  }
  return getAgentService().listAgents(session.organizationId);
}

/**
 * Invitation emails were removed from the schema — agents are created directly.
 */
export async function listPendingInvitations(): Promise<InvitationDto[]> {
  await verifySession();
  return [];
}

function mapAgent(row: Record<string, unknown>): AgentDto {
  return {
    id: String(row.id ?? ""),
    name: String(row.full_name ?? row.name ?? ""),
    email: String(row.email ?? ""),
    role: (String(row.role ?? "agent") as TenantRole) || "agent",
    status: row.status === "disabled" || row.is_active === false ? "disabled" : "active",
    createdAt: String(row.created_at ?? ""),
  };
}

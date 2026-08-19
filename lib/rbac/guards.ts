import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal/session";
import { mapTenantRoleToAppRole } from "./types";
import { isAdminTenant, AGENT_DEFAULT_ROUTE } from "./policy";
import type { AppRole } from "./types";

/**
 * Server-side guard: redirects non-admin users to the agent default route.
 * Call at the top of any admin-only page's server component.
 */
export async function assertAdminTenant(): Promise<void> {
  const session = await verifySession();
  const appRole = mapTenantRoleToAppRole(session.role);
  if (!isAdminTenant(appRole)) {
    redirect(AGENT_DEFAULT_ROUTE);
  }
}

/**
 * Returns the current user's AppRole from the session.
 */
export async function getAppRole(): Promise<AppRole> {
  const session = await verifySession();
  return mapTenantRoleToAppRole(session.role);
}

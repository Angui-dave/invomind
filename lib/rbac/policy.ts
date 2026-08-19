import type { AppRole, Permission } from "./types";

const ADMIN_PERMISSIONS: Permission[] = [
  "view_dashboard",
  "view_reports",
  "manage_settings",
  "manage_billing",
  "manage_agents",
  "use_import",
  "manage_webhooks",
  "view_clients",
  "view_invoices",
  "view_quotes",
  "view_payments",
  "view_expenses",
  "view_catalog",
  "view_suppliers",
  "view_conversations",
];

const AGENT_PERMISSIONS: Permission[] = [
  "view_clients",
  "view_invoices",
  "view_quotes",
  "view_payments",
  "view_expenses",
  "view_catalog",
  "view_suppliers",
  "view_conversations",
];

export function permissionsForRole(role: AppRole): Permission[] {
  return role === "ADMIN_TENANT" ? ADMIN_PERMISSIONS : AGENT_PERMISSIONS;
}

export function hasPermission(role: AppRole, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission);
}

export function isAdminTenant(role: AppRole): boolean {
  return role === "ADMIN_TENANT";
}

/** Routes that require ADMIN_TENANT */
export const ADMIN_ONLY_ROUTES = [
  "/dashboard",
  "/reports",
  "/settings",
  "/billing",
  "/import",
  "/agents",
] as const;

/** Default landing page for agents */
export const AGENT_DEFAULT_ROUTE = "/clients";

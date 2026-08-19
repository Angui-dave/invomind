import type { TenantRole } from "@/lib/mock/central";
import type { PlanId } from "@/lib/data/settings";

export type AppRole = "ADMIN_TENANT" | "AGENT";

export type Permission =
  | "view_dashboard"
  | "view_reports"
  | "manage_settings"
  | "manage_billing"
  | "manage_agents"
  | "use_import"
  | "manage_webhooks"
  | "view_clients"
  | "view_invoices"
  | "view_quotes"
  | "view_payments"
  | "view_expenses"
  | "view_catalog"
  | "view_suppliers"
  | "view_conversations";

export type PlanTier = "BASIC" | "PRO" | "ENTERPRISE";

export function mapPlanIdToTier(planId: PlanId): PlanTier {
  if (planId === "business") return "ENTERPRISE";
  if (planId === "pro") return "PRO";
  return "BASIC";
}

export function mapTenantRoleToAppRole(role: TenantRole): AppRole {
  if (role === "owner" || role === "admin") return "ADMIN_TENANT";
  return "AGENT";
}

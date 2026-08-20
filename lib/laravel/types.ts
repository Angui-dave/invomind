import type { PlanId } from "@/lib/data/settings";

export type ApiOrganizationFeatures = {
  pipeline?: boolean;
  conversations?: boolean;
  expenses?: boolean;
  catalog?: boolean;
  reports?: boolean;
  import_tool?: boolean;
};

export type ApiOrganizationPlan = {
  id: PlanId;
  name: string;
  price?: number | string;
  price_label: string;
  description: string;
  features?: string[];
  limit_label?: string | null;
  highlighted?: boolean;
  max_invoices_per_month?: number | null;
  max_clients?: number | null;
  auto_reminders?: boolean;
  online_payments?: boolean;
  pipeline?: boolean;
  conversations?: boolean;
  reports?: boolean;
  expenses?: boolean;
  catalog?: boolean;
  import_tool?: boolean;
};

export type ApiOrganizationSettings = {
  reminders_enabled?: boolean;
  reminder_cadence?: string[];
  payment_connected?: boolean;
  accepted_payment_methods?: string[];
} & Record<string, unknown>;

export type ApiOrganizationResponse = {
  id: string;
  name: string;
  slug: string;
  plan_id?: PlanId;
  settings?: ApiOrganizationSettings;
  branding?: unknown;
  features?: ApiOrganizationFeatures;
  subscription?: unknown;
  subscription_invoices?: unknown[];
  plan?: ApiOrganizationPlan | null;
};

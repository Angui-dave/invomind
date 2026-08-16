import "server-only";
import { verifySession } from "@/lib/dal/session";
import { tenantStore } from "@/lib/mock/store";
import type {
  BillingHistoryItem,
  EmailTemplate,
  OrgBranding,
  OrgSettings,
  OrgSettingsExtras,
} from "@/lib/data/settings";

export type { OrgBranding, OrgSettingsExtras };

export async function getOrgSettings(): Promise<OrgSettings> {
  await verifySession();
  const store = await tenantStore();
  return { ...store.orgSettings };
}

export async function getSettingsExtras(): Promise<OrgSettingsExtras> {
  await verifySession();
  const store = await tenantStore();
  return structuredClone(store.extras);
}

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  await verifySession();
  const store = await tenantStore();
  return structuredClone(store.emailTemplates);
}

export async function getBillingHistory(): Promise<BillingHistoryItem[]> {
  await verifySession();
  const store = await tenantStore();
  return structuredClone(store.billingHistory);
}

export async function getBranding(): Promise<OrgBranding | null> {
  await verifySession();
  const store = await tenantStore();
  return { ...store.branding };
}

export async function getEnabledModules(): Promise<
  import("@/lib/data/settings").EnabledModules
> {
  await verifySession();
  const store = await tenantStore();
  return { ...store.enabledModules };
}

export function mapBranding(branding: OrgBranding): OrgBranding {
  return branding;
}

export function mapOrgSettings(settings: OrgSettings): OrgSettings {
  return settings;
}

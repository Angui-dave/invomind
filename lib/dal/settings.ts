import "server-only";
import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { fetchOrganization, verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { mapBranding as mapApiBranding, mapOrgSettings as mapApiOrgSettings } from "@/lib/laravel/mappers";
import { tenantStore } from "@/lib/mock/store";
import type { CurrencyCode } from "@/lib/money";
import type {
  BillingHistoryItem,
  EmailTemplate,
  OrgBranding,
  OrgSettings,
  OrgSettingsExtras,
} from "@/lib/data/settings";

export type { OrgBranding, OrgSettingsExtras };

const REMINDER_EVENT_TO_MILESTONE: Record<
  string,
  NonNullable<EmailTemplate["milestone"]>
> = {
  "J-3": "J-3",
  "J+3": "J+3",
  "J+7": "J+7",
  "J+14": "J+14",
  "reminder_J-3": "J-3",
  "reminder_J+3": "J+3",
  "reminder_J+7": "J+7",
  "reminder_J+14": "J+14",
};

function reminderMilestoneFromEvent(
  value: string,
): EmailTemplate["milestone"] | undefined {
  return REMINDER_EVENT_TO_MILESTONE[value];
}

type ApiEmailTemplate = {
  id: string;
  event?: string;
  milestone?: string;
  label: string;
  subject: string;
  body: string;
};

type ApiBillingItem = {
  id: string;
  date: string;
  description: string;
  amount: number | string;
  currency: string;
  status: "paid" | "open";
};

export async function getOrgSettings(): Promise<OrgSettings> {
  await verifySession();
  if (isLaravelApiEnabled()) {
    const org = await fetchOrganization();
    return mapApiOrgSettings(org.settings ?? {});
  }
  const store = await tenantStore();
  return { ...store.orgSettings };
}

export async function getSettingsExtras(): Promise<OrgSettingsExtras> {
  await verifySession();
  if (isLaravelApiEnabled()) {
    const org = await fetchOrganization();
    const settings = org.settings ?? {};
    return {
      remindersEnabled: Boolean(settings.reminders_enabled),
      reminderCadence: (settings.reminder_cadence ?? ["J-3", "J+3", "J+7", "J+14"]) as OrgSettingsExtras["reminderCadence"],
      payment: {
        connected: Boolean(settings.payment_connected),
        provider: "cinetpay",
        acceptedMethods: (settings.accepted_payment_methods ?? ["card", "mobile_money", "transfer"]) as OrgSettingsExtras["payment"]["acceptedMethods"],
        feeNote: "",
      },
    };
  }
  const store = await tenantStore();
  return structuredClone(store.extras);
}

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    const token = (await readSessionCookie())?.accessToken;
    const templates = await laravelRequest<ApiEmailTemplate[]>("/email-templates", {
      token,
      organizationId: session.organizationId,
    });
    return templates.map((t) => {
      const event = t.event ?? String(t.milestone ?? t.id);
      return {
        id: t.id,
        event,
        milestone: reminderMilestoneFromEvent(event),
        label: t.label,
        subject: t.subject,
        body: t.body,
      };
    });
  }
  const store = await tenantStore();
  return structuredClone(store.emailTemplates);
}

export async function getBillingHistory(): Promise<BillingHistoryItem[]> {
  await verifySession();
  if (isLaravelApiEnabled()) {
    const org = await fetchOrganization();
    const rows = (org.subscription_invoices ?? []) as ApiBillingItem[];
    return rows.map((item) => ({
      id: item.id,
      date: item.date,
      description: item.description,
      amount: Number(item.amount ?? 0),
      currency: item.currency as CurrencyCode,
      status: item.status,
    }));
  }
  const store = await tenantStore();
  return structuredClone(store.billingHistory);
}

export async function getBranding(): Promise<OrgBranding | null> {
  await verifySession();
  if (isLaravelApiEnabled()) {
    const org = await fetchOrganization();
    return org.branding ? mapApiBranding(org.branding) : null;
  }
  const store = await tenantStore();
  return { ...store.branding };
}

export async function getEnabledModules(): Promise<
  import("@/lib/data/settings").EnabledModules
> {
  await verifySession();
  if (isLaravelApiEnabled()) {
    const org = await fetchOrganization();
    return {
      pipeline: Boolean(org.features?.pipeline),
      conversations: Boolean(org.features?.conversations),
      expenses: Boolean(org.features?.expenses),
      catalog: Boolean(org.features?.catalog),
      reports: Boolean(org.features?.reports),
      importTool: Boolean(org.features?.import_tool),
    };
  }
  const store = await tenantStore();
  return { ...store.enabledModules };
}

export function mapBranding(branding: OrgBranding): OrgBranding {
  return branding;
}

export function mapOrgSettings(settings: OrgSettings): OrgSettings {
  return settings;
}

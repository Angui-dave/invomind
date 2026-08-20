"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { actionErrorMessage } from "@/lib/laravel/action-errors";
import { getApiContext } from "@/lib/laravel/context";
import { mapTenantRoleToAppRole } from "@/lib/rbac/types";
import { isAdminTenant } from "@/lib/rbac/policy";
import { findTenant } from "@/lib/mock/central";
import { tenantStore } from "@/lib/mock/store";

async function assertSettingsAdmin() {
  const session = await verifySession();
  if (!isAdminTenant(mapTenantRoleToAppRole(session.role))) {
    throw new Error("Action réservée aux administrateurs");
  }
  return session;
}
import type { PaymentMethod } from "@/lib/documents";
import type { ReminderMilestone } from "@/lib/documents";
import type { CurrencyCode } from "@/lib/money";
import type { TaxMode } from "@/lib/tax";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

const CompanySchema = z.object({
  companyName: z.string().min(1),
  email: z.string().min(1),
  phone: z.string().default(""),
  address: z.string().default(""),
  city: z.string().default(""),
  postalCode: z.string().default(""),
  country: z.string().min(1),
  taxId: z.string().default(""),
  legalMentions: z.string().default(""),
});

const TaxSchema = z.object({
  defaultCurrency: z.string().min(1),
  defaultTaxMode: z.enum(["inclusive", "exclusive"]),
  defaultTaxRate: z.number().min(0),
});

const BankingSchema = z.object({
  bankName: z.string().default(""),
  iban: z.string().default(""),
  bic: z.string().default(""),
  qrIban: z.string().optional().nullable(),
  twintNumber: z.string().optional().nullable(),
  mobileMoneyProvider: z
    .enum(["orange_money", "wave", "mtn", "moov", "mpesa"])
    .optional()
    .nullable(),
  mobileMoneyNumber: z.string().optional().nullable(),
});

const RemindersSchema = z.object({
  remindersEnabled: z.boolean(),
  reminderCadence: z.array(z.string()),
});

const PaymentSettingsSchema = z.object({
  paymentConnected: z.boolean(),
  acceptedPaymentMethods: z.array(z.string()),
});

const BrandingSchema = z.object({
  displayName: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  primaryColor: z.string().min(1),
  accentColor: z.string().min(1),
  fontFamily: z.string().min(1).default("system-ui"),
  documentTemplate: z.enum(["classic", "modern", "minimal"]).default("classic"),
  locale: z.string().min(2).default("fr"),
  currency: z.string().min(3).default("XOF"),
});

const ModulesSchema = z.object({
  pipeline: z.boolean(),
  conversations: z.boolean(),
  expenses: z.boolean(),
  catalog: z.boolean(),
  reports: z.boolean(),
  importTool: z.boolean(),
});

const EmailTemplateSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  label: z.string().optional(),
});

export async function updateCompanySettings(
  input: z.infer<typeof CompanySchema>,
): Promise<ActionResult> {
  await assertSettingsAdmin();
  if (isLaravelApiEnabled()) {
    const parsed = CompanySchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Profil entreprise invalide" };
    try {
      const { token, organizationId } = await getApiContext();
      await laravelRequest("/organization/settings", {
        method: "PUT",
        token,
        organizationId,
        body: {
          company_name: parsed.data.companyName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          address: parsed.data.address,
          city: parsed.data.city,
          postal_code: parsed.data.postalCode,
          country: parsed.data.country,
          tax_id: parsed.data.taxId,
          legal_mentions: parsed.data.legalMentions,
        },
      });
      revalidatePath("/settings");
      revalidatePath("/dashboard");
      return { ok: true };
    } catch (error) {
      return { ok: false, error: actionErrorMessage(error, "Profil entreprise invalide") };
    }
  }
  const session = await verifySession();
  const parsed = CompanySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Profil entreprise invalide" };
  }

  const store = await tenantStore();
  Object.assign(store.orgSettings, parsed.data);

  const tenant = findTenant(session.organizationId);
  if (tenant) tenant.name = parsed.data.companyName;

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateTaxSettings(
  input: z.infer<typeof TaxSchema>,
): Promise<ActionResult> {
  await assertSettingsAdmin();
  if (isLaravelApiEnabled()) {
    const parsed = TaxSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Paramètres fiscaux invalides" };
    try {
      const { token, organizationId } = await getApiContext();
      await laravelRequest("/organization/tax", {
        method: "PUT",
        token,
        organizationId,
        body: {
          default_currency: parsed.data.defaultCurrency,
          default_tax_mode: parsed.data.defaultTaxMode,
          default_tax_rate: parsed.data.defaultTaxRate,
        },
      });
      revalidatePath("/settings");
      return { ok: true };
    } catch (error) {
      return { ok: false, error: actionErrorMessage(error, "Paramètres fiscaux invalides") };
    }
  }
  const parsed = TaxSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Paramètres fiscaux invalides" };
  }

  const store = await tenantStore();
  store.orgSettings.defaultCurrency = parsed.data
    .defaultCurrency as CurrencyCode;
  store.orgSettings.defaultTaxMode = parsed.data.defaultTaxMode as TaxMode;
  store.orgSettings.defaultTaxRate = parsed.data.defaultTaxRate;

  revalidatePath("/settings");
  return { ok: true };
}

export async function updateBankingSettings(
  input: z.infer<typeof BankingSchema>,
): Promise<ActionResult> {
  await assertSettingsAdmin();
  if (isLaravelApiEnabled()) {
    const parsed = BankingSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Coordonnées bancaires invalides" };
    try {
      const { token, organizationId } = await getApiContext();
      await laravelRequest("/organization/banking", {
        method: "PUT",
        token,
        organizationId,
        body: {
          bank_name: parsed.data.bankName,
          iban: parsed.data.iban,
          bic: parsed.data.bic,
          qr_iban: parsed.data.qrIban,
          twint_number: parsed.data.twintNumber,
          mobile_money_provider: parsed.data.mobileMoneyProvider,
          mobile_money_number: parsed.data.mobileMoneyNumber,
        },
      });
      revalidatePath("/settings");
      return { ok: true };
    } catch (error) {
      return { ok: false, error: actionErrorMessage(error, "Coordonnées bancaires invalides") };
    }
  }
  const parsed = BankingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Coordonnées bancaires invalides" };
  }

  const store = await tenantStore();
  store.orgSettings.bankName = parsed.data.bankName;
  store.orgSettings.iban = parsed.data.iban;
  store.orgSettings.bic = parsed.data.bic;
  store.orgSettings.qrIban = parsed.data.qrIban ?? undefined;
  store.orgSettings.twintNumber = parsed.data.twintNumber ?? undefined;
  store.orgSettings.mobileMoneyProvider =
    parsed.data.mobileMoneyProvider ?? undefined;
  store.orgSettings.mobileMoneyNumber =
    parsed.data.mobileMoneyNumber ?? undefined;

  revalidatePath("/settings");
  return { ok: true };
}

export async function updateRemindersSettings(
  input: z.infer<typeof RemindersSchema>,
): Promise<ActionResult> {
  await assertSettingsAdmin();
  if (isLaravelApiEnabled()) {
    const parsed = RemindersSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Paramètres de relance invalides" };
    try {
      const { token, organizationId } = await getApiContext();
      await laravelRequest("/organization/reminders", {
        method: "PUT",
        token,
        organizationId,
        body: {
          reminders_enabled: parsed.data.remindersEnabled,
          reminder_cadence: parsed.data.reminderCadence,
        },
      });
      revalidatePath("/settings");
      return { ok: true };
    } catch (error) {
      return { ok: false, error: actionErrorMessage(error, "Paramètres de relance invalides") };
    }
  }
  const parsed = RemindersSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Paramètres de relance invalides" };
  }

  const store = await tenantStore();
  store.extras.remindersEnabled = parsed.data.remindersEnabled;
  store.extras.reminderCadence = parsed.data
    .reminderCadence as ReminderMilestone[];

  revalidatePath("/settings");
  return { ok: true };
}

export async function updatePaymentSettings(
  input: z.infer<typeof PaymentSettingsSchema>,
): Promise<ActionResult> {
  await assertSettingsAdmin();
  if (isLaravelApiEnabled()) {
    const parsed = PaymentSettingsSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Paramètres de paiement invalides" };
    try {
      const { token, organizationId } = await getApiContext();
      await laravelRequest("/organization/payments", {
        method: "PUT",
        token,
        organizationId,
        body: {
          payment_connected: parsed.data.paymentConnected,
          accepted_payment_methods: parsed.data.acceptedPaymentMethods,
        },
      });
      revalidatePath("/settings");
      return { ok: true };
    } catch (error) {
      return { ok: false, error: actionErrorMessage(error, "Paramètres de paiement invalides") };
    }
  }
  const parsed = PaymentSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Paramètres de paiement invalides" };
  }

  const store = await tenantStore();
  store.extras.payment.connected = parsed.data.paymentConnected;
  store.extras.payment.acceptedMethods = parsed.data
    .acceptedPaymentMethods as PaymentMethod[];

  revalidatePath("/settings");
  return { ok: true };
}

export async function updateBranding(
  input: z.infer<typeof BrandingSchema>,
): Promise<ActionResult> {
  await assertSettingsAdmin();
  if (isLaravelApiEnabled()) {
    const parsed = BrandingSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Identité visuelle invalide" };
    try {
      const { token, organizationId } = await getApiContext();
      await laravelRequest("/organization/branding", {
        method: "PUT",
        token,
        organizationId,
        body: {
          display_name: parsed.data.displayName,
          logo_url: parsed.data.logoUrl,
          primary_color: parsed.data.primaryColor,
          accent_color: parsed.data.accentColor,
        },
      });
      revalidatePath("/settings");
      revalidatePath("/dashboard");
      return { ok: true };
    } catch (error) {
      return { ok: false, error: actionErrorMessage(error, "Identité visuelle invalide") };
    }
  }
  const parsed = BrandingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Identité visuelle invalide" };
  }

  const store = await tenantStore();
  store.branding = {
    displayName: parsed.data.displayName ?? null,
    logoUrl: parsed.data.logoUrl ?? null,
    primaryColor: parsed.data.primaryColor,
    accentColor: parsed.data.accentColor,
    fontFamily: parsed.data.fontFamily,
    documentTemplate: parsed.data.documentTemplate,
    locale: parsed.data.locale,
    currency: parsed.data.currency as import("@/lib/money").CurrencyCode,
  };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateEnabledModules(
  input: z.infer<typeof ModulesSchema>,
): Promise<ActionResult> {
  await assertSettingsAdmin();
  if (isLaravelApiEnabled()) {
    const parsed = ModulesSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Modules invalides" };
    try {
      const { token, organizationId } = await getApiContext();
      await laravelRequest("/organization/modules", {
        method: "PUT",
        token,
        organizationId,
        body: {
          pipeline: parsed.data.pipeline,
          conversations: parsed.data.conversations,
          expenses: parsed.data.expenses,
          catalog: parsed.data.catalog,
          reports: parsed.data.reports,
          import_tool: parsed.data.importTool,
        },
      });
      revalidatePath("/settings");
      revalidatePath("/dashboard");
      return { ok: true };
    } catch (error) {
      return { ok: false, error: actionErrorMessage(error, "Modules invalides") };
    }
  }
  const parsed = ModulesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Modules invalides" };
  }

  const store = await tenantStore();
  store.enabledModules = { ...parsed.data };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateEmailTemplate(
  milestone: string,
  input: z.infer<typeof EmailTemplateSchema>,
): Promise<ActionResult> {
  await assertSettingsAdmin();
  if (isLaravelApiEnabled()) {
    const parsed = EmailTemplateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Template invalide" };
    try {
      const { token, organizationId } = await getApiContext();
      await laravelRequest(`/email-templates/${milestone}`, {
        method: "PUT",
        token,
        organizationId,
        body: {
          subject: parsed.data.subject,
          body: parsed.data.body,
        },
      });
      revalidatePath("/settings");
      return { ok: true, id: milestone };
    } catch (error) {
      return { ok: false, error: actionErrorMessage(error, "Template invalide") };
    }
  }
  const parsed = EmailTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Template invalide" };
  }

  const store = await tenantStore();
  const idx = store.emailTemplates.findIndex((t) => t.id === milestone);
  if (idx < 0) return { ok: false, error: "Template introuvable" };

  store.emailTemplates[idx] = {
    ...store.emailTemplates[idx],
    subject: parsed.data.subject,
    body: parsed.data.body,
    ...(parsed.data.label ? { label: parsed.data.label } : {}),
  };

  revalidatePath("/settings");
  return { ok: true, id: milestone };
}

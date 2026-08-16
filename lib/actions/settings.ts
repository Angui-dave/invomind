"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifySession } from "@/lib/dal/session";
import { findTenant } from "@/lib/mock/central";
import { tenantStore } from "@/lib/mock/store";
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
  await verifySession();
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
  await verifySession();
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
  await verifySession();
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
  await verifySession();
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
  await verifySession();
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
  await verifySession();
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
  id: string,
  input: z.infer<typeof EmailTemplateSchema>,
): Promise<ActionResult> {
  await verifySession();
  const parsed = EmailTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Template invalide" };
  }

  const store = await tenantStore();
  const idx = store.emailTemplates.findIndex((t) => t.id === id);
  if (idx < 0) return { ok: false, error: "Template introuvable" };

  store.emailTemplates[idx] = {
    ...store.emailTemplates[idx],
    subject: parsed.data.subject,
    body: parsed.data.body,
    ...(parsed.data.label ? { label: parsed.data.label } : {}),
  };

  revalidatePath("/settings");
  return { ok: true, id };
}

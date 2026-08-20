import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./platform";
import { tenantPolicy } from "./helpers";

export const organizationSettings = pgTable(
  "organization_settings",
  {
    organizationId: uuid("organization_id")
      .primaryKey()
      .references(() => organizations.id, { onDelete: "cascade" }),
    companyName: text("company_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    address: text("address").notNull().default(""),
    city: text("city").notNull().default(""),
    postalCode: text("postal_code").notNull().default(""),
    country: text("country").notNull().default("SN"),
    taxId: text("tax_id").notNull().default(""),
    defaultCurrency: text("default_currency").notNull().default("XOF"),
    defaultTaxMode: text("default_tax_mode").notNull().default("exclusive"),
    defaultTaxRate: integer("default_tax_rate").notNull().default(18),
    bankName: text("bank_name").notNull().default(""),
    iban: text("iban").notNull().default(""),
    bic: text("bic").notNull().default(""),
    qrIban: text("qr_iban"),
    twintNumber: text("twint_number"),
    mobileMoneyProvider: text("mobile_money_provider"),
    mobileMoneyNumber: text("mobile_money_number"),
    legalMentions: text("legal_mentions").notNull().default(""),
    remindersEnabled: boolean("reminders_enabled").notNull().default(true),
    reminderCadence: text("reminder_cadence")
      .array()
      .notNull()
      .default(["J-3", "J+3", "J+7", "J+14"]),
    paymentConnected: boolean("payment_connected").notNull().default(false),
    acceptedPaymentMethods: text("accepted_payment_methods")
      .array()
      .notNull()
      .default(["card", "mobile_money", "transfer"]),
    pspProvider: text("psp_provider"),
    pspSiteId: text("psp_site_id"),
    pspApiKey: text("psp_api_key"),
    pspEnvironment: text("psp_environment").default("sandbox"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [tenantPolicy(t.organizationId)],
).enableRLS();

export const organizationBranding = pgTable(
  "organization_branding",
  {
    organizationId: uuid("organization_id")
      .primaryKey()
      .references(() => organizations.id, { onDelete: "cascade" }),
    displayName: text("display_name"),
    logoUrl: text("logo_url"),
    primaryColor: text("primary_color").notNull().default("#2563eb"),
    accentColor: text("accent_color").notNull().default("#10b981"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [tenantPolicy(t.organizationId)],
).enableRLS();

export const organizationFeatures = pgTable(
  "organization_features",
  {
    organizationId: uuid("organization_id")
      .primaryKey()
      .references(() => organizations.id, { onDelete: "cascade" }),
    pipeline: boolean("pipeline").notNull().default(true),
    conversations: boolean("conversations").notNull().default(true),
    expenses: boolean("expenses").notNull().default(true),
    catalog: boolean("catalog").notNull().default(true),
    reports: boolean("reports").notNull().default(true),
    importTool: boolean("import_tool").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [tenantPolicy(t.organizationId)],
).enableRLS();

export const emailTemplates = pgTable(
  "email_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    channel: text("channel").notNull().default("email"),
    event: text("event").notNull(),
    label: text("label").notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    tenantPolicy(t.organizationId),
    uniqueIndex("email_templates_org_channel_event_idx").on(
      t.organizationId,
      t.channel,
      t.event,
    ),
  ],
).enableRLS();

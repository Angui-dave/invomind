import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./platform";
import { portalTokenPolicy, tenantPolicy } from "./helpers";

export const documentKindEnum = pgEnum("document_kind", [
  "quote",
  "invoice",
  "credit_note",
]);

export const pipelineStageEnum = pgEnum("pipeline_stage", [
  "nouveau",
  "qualifie",
  "devis",
  "negociation",
  "gagne",
  "perdu",
]);

export const catalogKindEnum = pgEnum("catalog_kind", ["service", "product"]);

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    company: text("company").notNull().default(""),
    email: text("email").notNull(),
    phone: text("phone"),
    address: text("address"),
    city: text("city"),
    postalCode: text("postal_code"),
    country: text("country"),
    taxId: text("tax_id"),
    currency: text("currency"),
    paymentTermDays: integer("payment_term_days"),
    remindersEnabled: boolean("reminders_enabled").notNull().default(true),
    portalToken: text("portal_token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    tenantPolicy(t.organizationId),
    uniqueIndex("clients_org_portal_token_idx").on(
      t.organizationId,
      t.portalToken,
    ),
  ],
).enableRLS();

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    kind: documentKindEnum("kind").notNull(),
    number: text("number").notNull(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    clientName: text("client_name").notNull(),
    status: text("status").notNull(),
    currency: text("currency").notNull().default("XOF"),
    taxMode: text("tax_mode").notNull().default("exclusive"),
    issueDate: text("issue_date").notNull(),
    dueDate: text("due_date").notNull(),
    total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
    subtotalHt: numeric("subtotal_ht", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    taxTotal: numeric("tax_total", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    onlinePaymentEnabled: boolean("online_payment_enabled")
      .notNull()
      .default(false),
    paidOnlineAt: text("paid_online_at"),
    paymentMethod: text("payment_method"),
    remindersEnabled: boolean("reminders_enabled").notNull().default(true),
    portalToken: text("portal_token").notNull(),
    sourceDocumentId: uuid("source_document_id"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    tenantPolicy(t.organizationId),
    portalTokenPolicy(t.portalToken),
    uniqueIndex("documents_org_number_idx").on(t.organizationId, t.number),
    uniqueIndex("documents_portal_token_idx").on(t.portalToken),
  ],
).enableRLS();

export const documentLines = pgTable(
  "document_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 14, scale: 4 })
      .notNull()
      .default("1"),
    unitPrice: numeric("unit_price", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    taxRate: numeric("tax_rate", { precision: 6, scale: 2 }).notNull().default("0"),
    discountPercent: numeric("discount_percent", { precision: 6, scale: 2 }),
    catalogItemId: uuid("catalog_item_id"),
    position: integer("position").notNull().default(0),
  },
  (t) => [tenantPolicy(t.organizationId)],
).enableRLS();

export const documentReminders = pgTable(
  "document_reminders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    milestone: text("milestone").notNull(),
    state: text("state").notNull(),
    date: text("date").notNull(),
  },
  (t) => [tenantPolicy(t.organizationId)],
).enableRLS();

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "restrict" }),
    documentNumber: text("document_number").notNull(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    clientName: text("client_name").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("XOF"),
    method: text("method").notNull(),
    paidAt: text("paid_at").notNull(),
    reference: text("reference"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [tenantPolicy(t.organizationId)],
).enableRLS();

export const expenseCategories = pgTable(
  "expense_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#C9CCC3"),
  },
  (t) => [tenantPolicy(t.organizationId)],
).enableRLS();

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    company: text("company").notNull().default(""),
    email: text("email").notNull().default(""),
    phone: text("phone"),
    address: text("address"),
    city: text("city"),
    country: text("country"),
    taxId: text("tax_id"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [tenantPolicy(t.organizationId)],
).enableRLS();

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    description: text("description").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("XOF"),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => expenseCategories.id, { onDelete: "restrict" }),
    supplierId: uuid("supplier_id").references(() => suppliers.id, {
      onDelete: "set null",
    }),
    supplierName: text("supplier_name"),
    taxRate: numeric("tax_rate", { precision: 6, scale: 2 }).notNull().default("0"),
    taxDeductible: boolean("tax_deductible").notNull().default(true),
    taxAmount: numeric("tax_amount", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [tenantPolicy(t.organizationId)],
).enableRLS();

export const catalogItems = pgTable(
  "catalog_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("XOF"),
    taxRate: numeric("tax_rate", { precision: 6, scale: 2 }).notNull().default("0"),
    unit: text("unit").notNull().default("unité"),
    kind: catalogKindEnum("kind").notNull().default("service"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [tenantPolicy(t.organizationId)],
).enableRLS();

export const prospects = pgTable(
  "prospects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    company: text("company").notNull().default(""),
    estimatedValue: numeric("estimated_value", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    stage: pipelineStageEnum("stage").notNull().default("nouveau"),
    lastInteractionAt: text("last_interaction_at").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [tenantPolicy(t.organizationId)],
).enableRLS();

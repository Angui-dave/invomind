import "server-only";
import type { Client } from "@/lib/data/clients";
import { CLIENTS } from "@/lib/data/clients";
import type { BusinessDocument } from "@/lib/documents";
import { DOCUMENTS } from "@/lib/data/documents";
import type { Payment } from "@/lib/data/payments";
import { PAYMENTS } from "@/lib/data/payments";
import type { Expense, ExpenseCategory } from "@/lib/data/expenses";
import { EXPENSES, EXPENSE_CATEGORIES } from "@/lib/data/expenses";
import type { Supplier } from "@/lib/data/suppliers";
import { SUPPLIERS } from "@/lib/data/suppliers";
import type { CatalogItem } from "@/lib/data/catalog";
import { CATALOG_ITEMS } from "@/lib/data/catalog";
import type {
  Conversation,
  ConversationMessage,
} from "@/lib/data/conversations";
import {
  CONVERSATIONS,
  CONVERSATION_MESSAGES,
} from "@/lib/data/conversations";
import type {
  BillingHistoryItem,
  EmailTemplate,
  EnabledModules,
  OrgBranding,
  OrgSettings,
  OrgSettingsExtras,
  Prospect,
} from "@/lib/data/settings";
import {
  BILLING_HISTORY,
  DEFAULT_ORG_SETTINGS,
  EMAIL_TEMPLATES,
  ORG_SETTINGS,
  PAYMENT_PROVIDER,
  PROSPECTS,
} from "@/lib/data/settings";
import type { DeliveryAttempt, InboundMessage } from "@/lib/webhooks/types";
import { MOCK_ORG_ID } from "@/lib/config";
import { findTenant } from "@/lib/mock/central";
import { readSessionCookie } from "@/lib/auth/session";

function clone<T>(value: T): T {
  return structuredClone(value);
}

/**
 * Per-tenant business database (mock of a dedicated Postgres schema/DB).
 * Central auth/billing lives in lib/mock/central.ts.
 */
export type MockStore = {
  tenantId: string;
  clients: Client[];
  documents: BusinessDocument[];
  payments: Payment[];
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  suppliers: Supplier[];
  catalogItems: CatalogItem[];
  conversations: Conversation[];
  messages: ConversationMessage[];
  prospects: Prospect[];
  orgSettings: OrgSettings;
  branding: OrgBranding;
  enabledModules: EnabledModules;
  extras: OrgSettingsExtras;
  emailTemplates: EmailTemplate[];
  billingHistory: BillingHistoryItem[];
  inbound: InboundMessage[];
  deliveries: DeliveryAttempt[];
  webhook: { url: string; secret: string; enabled: boolean };
};

const globalForTenants = globalThis as unknown as {
  __invomindTenants?: Map<string, MockStore>;
};

function defaultBranding(
  displayName: string,
  currency: OrgSettings["defaultCurrency"] = "XOF",
): OrgBranding {
  return {
    displayName,
    logoUrl: null,
    primaryColor: "#2563eb",
    accentColor: "#10b981",
    fontFamily: "system-ui",
    documentTemplate: "classic",
    locale: "fr",
    currency,
  };
}

function defaultModules(): EnabledModules {
  return {
    pipeline: true,
    conversations: true,
    expenses: true,
    catalog: true,
    reports: true,
    importTool: true,
  };
}

function defaultExtras(): OrgSettingsExtras {
  return {
    remindersEnabled: true,
    reminderCadence: ["J-3", "J+3", "J+7", "J+14"],
    payment: clone(PAYMENT_PROVIDER),
  };
}

/** Demo org — seeded with sample data */
export function createSeededStore(tenantId: string = MOCK_ORG_ID): MockStore {
  return {
    tenantId,
    clients: clone(CLIENTS),
    documents: clone(DOCUMENTS),
    payments: clone(PAYMENTS),
    expenses: clone(EXPENSES),
    expenseCategories: clone(EXPENSE_CATEGORIES),
    suppliers: clone(SUPPLIERS),
    catalogItems: clone(CATALOG_ITEMS),
    conversations: clone(CONVERSATIONS),
    messages: clone(CONVERSATION_MESSAGES),
    prospects: clone(PROSPECTS),
    orgSettings: clone(ORG_SETTINGS),
    branding: defaultBranding(ORG_SETTINGS.companyName, ORG_SETTINGS.defaultCurrency),
    enabledModules: defaultModules(),
    extras: defaultExtras(),
    emailTemplates: clone(EMAIL_TEMPLATES),
    billingHistory: clone(BILLING_HISTORY),
    inbound: [],
    deliveries: [],
    webhook: {
      url: process.env.CONVERSATIONS_WEBHOOK_URL ?? "",
      secret: process.env.CONVERSATIONS_WEBHOOK_SECRET ?? "",
      enabled: Boolean(process.env.CONVERSATIONS_WEBHOOK_URL),
    },
  };
}

/** New tenant — empty DB after "migrations" */
export function createEmptyStore(
  tenantId: string,
  org: { companyName: string; email: string },
): MockStore {
  const settings: OrgSettings = {
    ...clone(DEFAULT_ORG_SETTINGS),
    companyName: org.companyName,
    email: org.email,
  };
  return {
    tenantId,
    clients: [],
    documents: [],
    payments: [],
    expenses: [],
    expenseCategories: clone(EXPENSE_CATEGORIES),
    suppliers: [],
    catalogItems: [],
    conversations: [],
    messages: [],
    prospects: [],
    orgSettings: settings,
    branding: defaultBranding(org.companyName, settings.defaultCurrency),
    enabledModules: defaultModules(),
    extras: {
      remindersEnabled: false,
      reminderCadence: ["J-3", "J+3", "J+7", "J+14"],
      payment: {
        connected: false,
        provider: "stripe",
        acceptedMethods: ["card", "transfer"],
        feeNote: PAYMENT_PROVIDER.feeNote,
      },
    },
    emailTemplates: clone(EMAIL_TEMPLATES),
    billingHistory: [],
    inbound: [],
    deliveries: [],
    webhook: { url: "", secret: "", enabled: false },
  };
}

function tenantMap(): Map<string, MockStore> {
  if (!globalForTenants.__invomindTenants) {
    const map = new Map<string, MockStore>();
    map.set(MOCK_ORG_ID, createSeededStore(MOCK_ORG_ID));
    globalForTenants.__invomindTenants = map;
  }
  return globalForTenants.__invomindTenants;
}

export function tenantStoreById(tenantId: string): MockStore {
  const map = tenantMap();
  let store = map.get(tenantId);
  if (!store) {
    const tenant = findTenant(tenantId);
    store = createEmptyStore(tenantId, {
      companyName: tenant?.name ?? "Organisation",
      email: "",
    });
    map.set(tenantId, store);
  }
  return store;
}

/** Register a freshly provisioned empty tenant DB */
export function registerTenantStore(
  tenantId: string,
  org: { companyName: string; email: string },
): MockStore {
  const store = createEmptyStore(tenantId, org);
  tenantMap().set(tenantId, store);
  return store;
}

/**
 * Resolve the current user's tenant store from the session cookie.
 * Prefer this over getMockStore() in authenticated paths.
 */
export async function tenantStore(): Promise<MockStore> {
  const payload = await readSessionCookie();
  if (!payload?.organizationId) {
    throw new Error("Session requise pour accéder aux données du tenant");
  }
  return tenantStoreById(payload.organizationId);
}

/**
 * @deprecated Use tenantStore() / tenantStoreById(). Kept for gradual migration.
 * Falls back to demo org when no session (legacy callers).
 */
export function getMockStore(): MockStore {
  return tenantStoreById(MOCK_ORG_ID);
}

/** Find which tenant owns a portal invoice token */
export function findTenantIdByPortalToken(token: string): string | null {
  for (const [tenantId, store] of tenantMap()) {
    if (
      store.documents.some(
        (d) => d.portalToken === token && d.kind === "invoice",
      )
    ) {
      return tenantId;
    }
  }
  return null;
}

export function resetAllTenantStores(): void {
  const map = new Map<string, MockStore>();
  map.set(MOCK_ORG_ID, createSeededStore(MOCK_ORG_ID));
  globalForTenants.__invomindTenants = map;
}

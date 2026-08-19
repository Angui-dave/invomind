import "server-only";
import { randomBytes } from "crypto";
import { MOCK_ORG_ID } from "@/lib/config";
import type { PlanId } from "@/lib/data/settings";
import { PRICING_PLANS } from "@/lib/data/settings";
import type { ConversationChannel } from "@/lib/data/conversations";

/**
 * Central (landlord) database — mirrors Laravel central connection.
 * Tenants each get an isolated store via lib/mock/store.ts.
 */

export type TenantRole = "owner" | "admin" | "member";

export type CentralTenant = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type CentralUser = {
  id: string;
  name: string;
  email: string;
  /** Mock password hash: mock$password */
  passwordHash: string;
  lastTenantId: string | null;
};

export type CentralMembership = {
  userId: string;
  tenantId: string;
  role: TenantRole;
};

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "canceled"
  | "past_due";

export type CentralSubscription = {
  id: string;
  tenantId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
};

export type ChannelConnection = {
  id: string;
  tenantId: string;
  channel: ConversationChannel;
  externalId: string;
};

export type PlanLimits = {
  id: PlanId;
  name: string;
  price: number;
  priceLabel: string;
  description: string;
  features: string[];
  limitLabel?: string;
  highlighted?: boolean;
  maxInvoicesPerMonth: number | null;
  maxClients: number | null;
  autoReminders: boolean;
  onlinePayments: boolean;
  pipeline: boolean;
  conversations: boolean;
  reports: boolean;
  expenses: boolean;
  catalog: boolean;
  importTool: boolean;
};

export type CentralStore = {
  tenants: CentralTenant[];
  users: CentralUser[];
  memberships: CentralMembership[];
  subscriptions: CentralSubscription[];
  channelConnections: ChannelConnection[];
  plans: PlanLimits[];
};

const globalForCentral = globalThis as unknown as {
  __invomindCentral?: CentralStore;
};

function planLimitsFromCatalog(): PlanLimits[] {
  return PRICING_PLANS.map((p) => {
    if (p.id === "free") {
      return {
        ...p,
        maxInvoicesPerMonth: 3,
        maxClients: 5,
        autoReminders: false,
        onlinePayments: false,
        pipeline: false,
        conversations: false,
        reports: true,
        expenses: true,
        catalog: true,
        importTool: false,
      };
    }
    if (p.id === "pro") {
      return {
        ...p,
        maxInvoicesPerMonth: null,
        maxClients: null,
        autoReminders: true,
        onlinePayments: true,
        pipeline: true,
        conversations: true,
        reports: true,
        expenses: true,
        catalog: true,
        importTool: true,
      };
    }
    // business
    return {
      ...p,
      maxInvoicesPerMonth: null,
      maxClients: null,
      autoReminders: true,
      onlinePayments: true,
      pipeline: true,
      conversations: true,
      reports: true,
      expenses: true,
      catalog: true,
      importTool: true,
    };
  });
}

function createCentral(): CentralStore {
  // Load seed data from JSON fixtures
  const fixtureTenants: CentralTenant[] = require("./fixtures/tenants.json");
  const fixtureUsers: CentralUser[] = require("./fixtures/users.json");
  const fixtureMemberships: CentralMembership[] = require("./fixtures/memberships.json");
  const fixtureSubscriptions: CentralSubscription[] = require("./fixtures/subscriptions.json");

  return {
    tenants: [...fixtureTenants],
    users: [...fixtureUsers],
    memberships: [...fixtureMemberships],
    subscriptions: [...fixtureSubscriptions],
    channelConnections: [
      {
        id: "ch_wa_demo",
        tenantId: MOCK_ORG_ID,
        channel: "whatsapp",
        externalId: process.env.META_WHATSAPP_PHONE_NUMBER_ID ?? "demo-wa",
      },
      {
        id: "ch_ig_demo",
        tenantId: MOCK_ORG_ID,
        channel: "instagram",
        externalId: process.env.META_INSTAGRAM_PAGE_ID ?? "demo-ig",
      },
      {
        id: "ch_ms_demo",
        tenantId: MOCK_ORG_ID,
        channel: "messenger",
        externalId: process.env.META_MESSENGER_PAGE_ID ?? "demo-ms",
      },
      {
        id: "ch_tt_demo",
        tenantId: MOCK_ORG_ID,
        channel: "tiktok",
        externalId: process.env.TIKTOK_BUSINESS_ID ?? "demo-tt",
      },
    ],
    plans: planLimitsFromCatalog(),
  };
}

export function getCentral(): CentralStore {
  if (!globalForCentral.__invomindCentral) {
    globalForCentral.__invomindCentral = createCentral();
  }
  return globalForCentral.__invomindCentral;
}

export function resetCentral(): void {
  globalForCentral.__invomindCentral = createCentral();
}

export function findUserByEmail(email: string): CentralUser | undefined {
  return getCentral().users.find(
    (u) => u.email === email.trim().toLowerCase(),
  );
}

export function findUserById(id: string): CentralUser | undefined {
  return getCentral().users.find((u) => u.id === id);
}

export function findTenant(id: string): CentralTenant | undefined {
  return getCentral().tenants.find((t) => t.id === id);
}

export function membershipsForUser(userId: string): CentralMembership[] {
  return getCentral().memberships.filter((m) => m.userId === userId);
}

export function membershipFor(
  userId: string,
  tenantId: string,
): CentralMembership | undefined {
  return getCentral().memberships.find(
    (m) => m.userId === userId && m.tenantId === tenantId,
  );
}

export function membersForTenant(tenantId: string): CentralMembership[] {
  return getCentral().memberships.filter((m) => m.tenantId === tenantId);
}

export function subscriptionForTenant(
  tenantId: string,
): CentralSubscription | undefined {
  return getCentral().subscriptions.find((s) => s.tenantId === tenantId);
}

export function planById(planId: PlanId): PlanLimits {
  const plans = getCentral().plans;
  return plans.find((p) => p.id === planId) ?? plans[0];
}

export function resolveTenantByExternalId(
  externalId: string,
): string | null {
  if (!externalId) return null;
  const row = getCentral().channelConnections.find(
    (c) => c.externalId === externalId,
  );
  return row?.tenantId ?? null;
}

export function slugifyOrgName(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const suffix = randomBytes(3).toString("hex");
  return `${base || "org"}-${suffix}`;
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(4).toString("hex")}`;
}

export type ProvisionTenantInput = {
  companyName: string;
  userName: string;
  email: string;
  password: string;
};

export type ProvisionTenantResult = {
  tenant: CentralTenant;
  user: CentralUser;
  membership: CentralMembership;
  subscription: CentralSubscription;
};

/** Creates central records for a new organization (empty tenant DB created separately). */
export function provisionTenant(
  input: ProvisionTenantInput,
): ProvisionTenantResult {
  const central = getCentral();
  const email = input.email.trim().toLowerCase();
  if (central.users.some((u) => u.email === email)) {
    throw new Error("Un compte existe déjà avec cet e-mail");
  }

  const now = new Date().toISOString();
  const tenant: CentralTenant = {
    id: newId("org"),
    name: input.companyName,
    slug: slugifyOrgName(input.companyName),
    createdAt: now,
  };
  const user: CentralUser = {
    id: newId("usr"),
    name: input.userName,
    email,
    passwordHash: `mock$${input.password}`,
    lastTenantId: tenant.id,
  };
  const membership: CentralMembership = {
    userId: user.id,
    tenantId: tenant.id,
    role: "owner",
  };
  const subscription: CentralSubscription = {
    id: newId("sub"),
    tenantId: tenant.id,
    planId: "free",
    status: "active",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodStart: now,
    currentPeriodEnd: null,
  };

  central.tenants.push(tenant);
  central.users.push(user);
  central.memberships.push(membership);
  central.subscriptions.push(subscription);

  return { tenant, user, membership, subscription };
}

export function setTenantPlan(
  tenantId: string,
  planId: PlanId,
  status: SubscriptionStatus = "active",
): CentralSubscription {
  const central = getCentral();
  let sub = central.subscriptions.find((s) => s.tenantId === tenantId);
  const now = new Date().toISOString();
  if (!sub) {
    sub = {
      id: newId("sub"),
      tenantId,
      planId,
      status,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodStart: now,
      currentPeriodEnd: null,
    };
    central.subscriptions.push(sub);
  } else {
    sub.planId = planId;
    sub.status = status;
    sub.currentPeriodStart = now;
  }
  return sub;
}

export function cancelTenantSubscription(
  tenantId: string,
): CentralSubscription | null {
  const sub = subscriptionForTenant(tenantId);
  if (!sub) return null;
  sub.status = "canceled";
  sub.planId = "free";
  return sub;
}

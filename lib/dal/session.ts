import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/auth/session";
import {
  findTenant,
  findUserById,
  membershipFor,
  planById,
  subscriptionForTenant,
} from "@/lib/mock/central";
import { tenantStoreById } from "@/lib/mock/store";
import type { EnabledModules, PlanId } from "@/lib/data/settings";

export type VerifiedSession = {
  sessionId: string;
  userId: string;
  organizationId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    planId: PlanId;
  };
  role: "owner" | "admin" | "member";
};

function intersectModules(
  enabled: EnabledModules,
  plan: ReturnType<typeof planById>,
): EnabledModules {
  return {
    pipeline: enabled.pipeline && plan.pipeline,
    conversations: enabled.conversations && plan.conversations,
    expenses: enabled.expenses && plan.expenses,
    catalog: enabled.catalog && plan.catalog,
    reports: enabled.reports && plan.reports,
    importTool: enabled.importTool && plan.importTool,
  };
}

export const verifySession = cache(async (): Promise<VerifiedSession> => {
  const payload = await readSessionCookie();
  if (!payload?.userId || !payload?.organizationId) {
    redirect("/login");
  }

  const user = findUserById(payload.userId);
  const tenant = findTenant(payload.organizationId);
  const membership = membershipFor(payload.userId, payload.organizationId);
  if (!user || !tenant || !membership) {
    redirect("/login");
  }

  const subscription = subscriptionForTenant(tenant.id);
  const planId = subscription?.planId ?? "free";

  return {
    sessionId: payload.sessionId,
    userId: user.id,
    organizationId: tenant.id,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    organization: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      planId,
    },
    role: membership.role,
  };
});

export const getOptionalSession = cache(async () => {
  try {
    return await readSessionCookie();
  } catch {
    return null;
  }
});

export const getCurrentOrganization = cache(async () => {
  const session = await verifySession();
  const store = tenantStoreById(session.organizationId);
  const subscription = subscriptionForTenant(session.organizationId);
  const plan = planById(session.organization.planId);
  const features = intersectModules(store.enabledModules, plan);

  return {
    session,
    settings: store.orgSettings,
    branding: store.branding,
    enabledModules: store.enabledModules,
    features,
    subscription: subscription
      ? {
          id: subscription.id,
          organizationId: subscription.tenantId,
          planId: subscription.planId,
          status: subscription.status,
          stripeCustomerId: subscription.stripeCustomerId,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          currentPeriodStart: subscription.currentPeriodStart
            ? new Date(subscription.currentPeriodStart)
            : null,
          currentPeriodEnd: subscription.currentPeriodEnd
            ? new Date(subscription.currentPeriodEnd)
            : null,
          createdAt: new Date(subscription.currentPeriodStart ?? Date.now()),
          updatedAt: new Date(),
        }
      : null,
    plan: {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      priceLabel: plan.priceLabel,
      description: plan.description,
      features: plan.features,
      limitLabel: plan.limitLabel ?? null,
      highlighted: plan.highlighted ?? false,
      maxInvoicesPerMonth: plan.maxInvoicesPerMonth,
      maxClients: plan.maxClients,
      autoReminders: plan.autoReminders,
      onlinePayments: plan.onlinePayments,
      pipeline: plan.pipeline,
      conversations: plan.conversations,
      reports: plan.reports,
      expenses: plan.expenses,
      catalog: plan.catalog,
      importTool: plan.importTool,
      stripePriceId: null,
    },
  };
});

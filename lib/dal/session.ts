import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { laravelRequest } from "@/lib/laravel/client";
import { mapBranding as mapApiBranding, mapOrgSettings as mapApiOrgSettings } from "@/lib/laravel/mappers";
import {
  findTenant,
  findUserById,
  membershipFor,
  planById,
  subscriptionForTenant,
} from "@/lib/mock/central";
import { tenantStoreById } from "@/lib/mock/store";
import { DEFAULT_ORG_SETTINGS } from "@/lib/data/settings";
import type { EnabledModules, PlanId } from "@/lib/data/settings";

type ApiOrganizationResponse = {
  id: string;
  name: string;
  slug: string;
  plan_id?: PlanId;
  settings?: unknown;
  branding?: unknown;
  features?: {
    pipeline?: boolean;
    conversations?: boolean;
    expenses?: boolean;
    catalog?: boolean;
    reports?: boolean;
    import_tool?: boolean;
  };
  subscription?: unknown;
  plan?: {
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
  } | null;
};

type ApiEntitlementsResponse = {
  pipeline?: boolean;
  conversations?: boolean;
  reports?: boolean;
  expenses?: boolean;
  catalog?: boolean;
  import_tool?: boolean;
};

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
  planFlags: Pick<
    EnabledModules,
    "pipeline" | "conversations" | "expenses" | "catalog" | "reports" | "importTool"
  >,
): EnabledModules {
  return {
    pipeline: enabled.pipeline && planFlags.pipeline,
    conversations: enabled.conversations && planFlags.conversations,
    expenses: enabled.expenses && planFlags.expenses,
    catalog: enabled.catalog && planFlags.catalog,
    reports: enabled.reports && planFlags.reports,
    importTool: enabled.importTool && planFlags.importTool,
  };
}

export const verifySession = cache(async (): Promise<VerifiedSession> => {
  const payload = await readSessionCookie();
  if (!payload?.userId || !payload?.organizationId) {
    redirect("/login?clear_session=1");
  }

  if (isLaravelApiEnabled()) {
    try {
      const me = await laravelRequest<{
        user: { id: string; name: string; email: string };
        organization_id: string;
        organization?: { id: string; name: string; slug: string; plan_id?: PlanId } | null;
        role: "owner" | "admin" | "member";
      }>("/auth/me", {
        token: payload.accessToken,
        organizationId: payload.organizationId,
      });

      // Keep the session cookie org — do not overwrite with an unrelated membership.
      const organizationId = payload.organizationId;
      if (me.organization_id !== organizationId) {
        redirect("/login?clear_session=1");
      }

      return {
        sessionId: payload.sessionId,
        userId: me.user.id,
        organizationId,
        user: me.user,
        organization: {
          id: organizationId,
          name: me.organization?.name ?? "Organization",
          slug: me.organization?.slug ?? "organization",
          planId: (me.organization?.plan_id ?? "free") as PlanId,
        },
        role: me.role ?? payload.role ?? "member",
      };
    } catch {
      redirect("/login?clear_session=1");
    }
  }

  const user = findUserById(payload.userId);
  const tenant = findTenant(payload.organizationId);
  const membership = membershipFor(payload.userId, payload.organizationId);
  if (!user || !tenant || !membership) {
    redirect("/login?clear_session=1");
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
  if (isLaravelApiEnabled()) {
    const token = (await readSessionCookie())?.accessToken;
    const organization = await laravelRequest<ApiOrganizationResponse>("/organization", {
      token,
      organizationId: session.organizationId,
    });
    const entitlements = await laravelRequest<ApiEntitlementsResponse>("/organization/entitlements", {
      token,
      organizationId: session.organizationId,
    });

    const enabledModules: EnabledModules = {
      pipeline: Boolean(organization.features?.pipeline),
      conversations: Boolean(organization.features?.conversations),
      expenses: Boolean(organization.features?.expenses),
      catalog: Boolean(organization.features?.catalog),
      reports: Boolean(organization.features?.reports),
      importTool: Boolean(organization.features?.import_tool),
    };

    const planFlags: EnabledModules = {
      pipeline: Boolean(entitlements.pipeline ?? organization.plan?.pipeline),
      conversations: Boolean(entitlements.conversations ?? organization.plan?.conversations),
      expenses: Boolean(entitlements.expenses ?? organization.plan?.expenses ?? true),
      catalog: Boolean(entitlements.catalog ?? organization.plan?.catalog ?? true),
      reports: Boolean(entitlements.reports ?? organization.plan?.reports ?? true),
      importTool: Boolean(entitlements.import_tool ?? organization.plan?.import_tool),
    };

    const features = intersectModules(enabledModules, planFlags);

    return {
      session: {
        ...session,
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          planId: (organization.plan_id ?? "free") as PlanId,
        },
      },
      settings: organization.settings
        ? mapApiOrgSettings(organization.settings)
        : { ...DEFAULT_ORG_SETTINGS },
      branding: organization.branding
        ? mapApiBranding(organization.branding)
        : {
            displayName: null,
            logoUrl: null,
            primaryColor: "#2563eb",
            accentColor: "#10b981",
            fontFamily: "Inter",
            documentTemplate: "classic" as const,
            locale: "fr-SN",
            currency: "XOF" as const,
          },
      enabledModules,
      features,
      subscription: organization.subscription ?? null,
      plan: organization.plan
        ? {
            id: organization.plan.id,
            name: organization.plan.name,
            price: Number(organization.plan.price ?? 0),
            priceLabel: organization.plan.price_label,
            description: organization.plan.description,
            features: organization.plan.features ?? [],
            limitLabel: organization.plan.limit_label ?? null,
            highlighted: Boolean(organization.plan.highlighted),
            maxInvoicesPerMonth: organization.plan.max_invoices_per_month ?? null,
            maxClients: organization.plan.max_clients ?? null,
            autoReminders: Boolean(organization.plan.auto_reminders),
            onlinePayments: Boolean(organization.plan.online_payments),
            pipeline: Boolean(organization.plan.pipeline),
            conversations: Boolean(organization.plan.conversations),
            reports: Boolean(organization.plan.reports),
            expenses: Boolean(organization.plan.expenses ?? planFlags.expenses),
            catalog: Boolean(organization.plan.catalog ?? planFlags.catalog),
            importTool: Boolean(organization.plan.import_tool ?? planFlags.importTool),
          }
        : {
            id: "free" as PlanId,
            name: "Free",
            price: 0,
            priceLabel: "0",
            description: "",
            features: [],
            limitLabel: null,
            highlighted: false,
            maxInvoicesPerMonth: null,
            maxClients: null,
            autoReminders: false,
            onlinePayments: false,
            pipeline: false,
            conversations: false,
            reports: true,
            expenses: true,
            catalog: true,
            importTool: false,
          },
    };
  }
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
    },
  };
});

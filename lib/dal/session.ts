import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/auth/session";
import { rethrowNextNavigation } from "@/lib/auth/navigation";
import { isLaravelApiEnabled } from "@/lib/config";
import { laravelRequest, LaravelApiError } from "@/lib/laravel/client";
import {
  findTenant,
  findUserById,
  membershipFor,
  planById,
  subscriptionForTenant,
} from "@/lib/mock/central";
import { tenantStoreById } from "@/lib/mock/store";
import {
  fetchLaravelEntitlementsRaw,
  type ApiEntitlementsResponse,
} from "@/lib/billing/entitlements";
import { DEFAULT_ORG_SETTINGS } from "@/lib/data/settings";
import type { EnabledModules, PlanId } from "@/lib/data/settings";
import type { ApiOrganizationResponse } from "@/lib/laravel/types";

type ApiMeResponse = {
  user: {
    id: string | number;
    name?: string;
    full_name?: string;
    email: string;
  };
  organization_id: string | number;
  organization?: {
    id: string | number;
    uuid?: string;
    name?: string;
    name_company?: string;
    slug?: string;
    plan_id?: string;
    plan_code?: string;
    logo_url?: string | null;
  } | null;
  role?: string;
};

type ApiOrgShowResponse = {
  id: string | number;
  uuid?: string;
  name_company?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  adresse?: string | null;
  ville?: string | null;
  code_postal?: string | null;
  pays?: string | null;
  logo_url?: string | null;
  devise_defaut?: string;
  subscription?: {
    plan_code?: string | null;
    plan_id?: number | string | null;
    statut?: string;
  } | null;
  subscription_invoices?: unknown[];
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
  role: "owner" | "admin" | "member" | "agent";
};

function normalizePlanId(code?: string | null): PlanId {
  if (code === "pro") return "pro";
  if (code === "business") return "business";
  // Backend "gratuit" maps to front PlanId "free"
  return "free";
}

function normalizeRole(role?: string | null): VerifiedSession["role"] {
  if (role === "owner" || role === "admin" || role === "member" || role === "agent") {
    return role;
  }
  return "admin";
}

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
    if (!payload.accessToken) {
      redirect("/login?clear_session=1");
    }

    try {
      const me = await laravelRequest<ApiMeResponse>("/auth/me", {
        token: payload.accessToken,
        organizationId: String(payload.organizationId),
      });

      const meOrgId = String(me.organization_id ?? me.organization?.id ?? "");
      const cookieOrgId = String(payload.organizationId);

      if (!meOrgId || meOrgId !== cookieOrgId) {
        redirect("/login?clear_session=1");
      }

      const planCode =
        me.organization?.plan_code ?? me.organization?.plan_id ?? null;

      return {
        sessionId: payload.sessionId,
        userId: String(me.user.id),
        organizationId: cookieOrgId,
        user: {
          id: String(me.user.id),
          name: me.user.full_name ?? me.user.name ?? me.user.email,
          email: me.user.email,
        },
        organization: {
          id: cookieOrgId,
          name:
            me.organization?.name_company ??
            me.organization?.name ??
            "Organisation",
          slug: me.organization?.slug ?? me.organization?.uuid ?? cookieOrgId,
          planId: normalizePlanId(planCode),
        },
        role: normalizeRole(me.role ?? payload.role),
      };
    } catch (error) {
      rethrowNextNavigation(error);
      // Only wipe the session on definitive auth failures.
      if (error instanceof LaravelApiError && [401, 403].includes(error.status)) {
        redirect("/login?clear_session=1");
      }
      console.error("verifySession /auth/me failed (non-auth)", error);
      // Transient API errors: trust the signed session cookie for this request
      // so a flaky /auth/me does not bounce the user into a login loop.
      return {
        sessionId: payload.sessionId,
        userId: String(payload.userId),
        organizationId: String(payload.organizationId),
        user: {
          id: String(payload.userId),
          name: "",
          email: "",
        },
        organization: {
          id: String(payload.organizationId),
          name: "Organisation",
          slug: String(payload.organizationId),
          planId: "free",
        },
        role: normalizeRole(payload.role),
      };
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

export const fetchOrganization = cache(async (): Promise<ApiOrganizationResponse> => {
  const session = await verifySession();
  const token = (await readSessionCookie())?.accessToken;
  const org = await laravelRequest<ApiOrgShowResponse>("/organization", {
    token,
    organizationId: session.organizationId,
  });

  const planCode = org.subscription?.plan_code ?? null;
  const planId = normalizePlanId(planCode);

  return {
    id: String(org.id),
    name: org.name_company ?? org.name ?? session.organization.name,
    slug: org.uuid ?? String(org.id),
    plan_id: planId,
    settings: {
      company_name: org.name_company,
      email: org.email,
      phone: org.phone,
      address: org.adresse,
      city: org.ville,
      postal_code: org.code_postal,
      country: org.pays,
      default_currency: org.devise_defaut ?? "XOF",
      default_tax_mode: "exclusive",
      default_tax_rate: 18,
    },
    branding: {
      display_name: org.name_company,
      logo_url: org.logo_url,
      primary_color: "#2563eb",
      accent_color: "#10b981",
      font_family: "Inter",
      document_template: "classic",
      locale: "fr-CI",
      currency: org.devise_defaut ?? "XOF",
    },
    features: {
      pipeline: false,
      conversations: true,
      expenses: true,
      catalog: true,
      reports: true,
      import_tool: planId !== "free",
    },
    subscription: org.subscription ?? null,
    subscription_invoices: org.subscription_invoices ?? [],
    plan: null,
  };
});

export const getCurrentOrganization = cache(async () => {
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    let organization: ApiOrganizationResponse;

    try {
      organization = await fetchOrganization();
    } catch (error) {
      rethrowNextNavigation(error);
      console.error("getCurrentOrganization /organization failed", error);
      organization = {
        id: session.organizationId,
        name: session.organization.name,
        slug: session.organization.slug,
        plan_id: session.organization.planId,
        settings: {},
        branding: {},
        features: {
          pipeline: false,
          conversations: true,
          expenses: true,
          catalog: true,
          reports: true,
          import_tool: session.organization.planId !== "free",
        },
        subscription: null,
        plan: null,
      };
    }

    const entitlements: ApiEntitlementsResponse =
      await fetchLaravelEntitlementsRaw(session.organizationId);

    const enabledModules: EnabledModules = {
      pipeline: Boolean(organization.features?.pipeline),
      conversations: Boolean(organization.features?.conversations ?? true),
      expenses: Boolean(organization.features?.expenses ?? true),
      catalog: Boolean(organization.features?.catalog ?? true),
      reports: Boolean(organization.features?.reports ?? true),
      importTool: Boolean(organization.features?.import_tool),
    };

    const planFlags: EnabledModules = {
      pipeline: Boolean(entitlements.pipeline),
      conversations: Boolean(entitlements.conversations),
      expenses: Boolean(entitlements.expenses ?? true),
      catalog: Boolean(entitlements.catalog ?? true),
      reports: Boolean(entitlements.reports ?? true),
      importTool: Boolean(entitlements.import_tool),
    };

    const features = intersectModules(enabledModules, planFlags);
    const planId = normalizePlanId(
      entitlements.plan_code ?? entitlements.plan_id ?? organization.plan_id,
    );

    const settingsRaw = organization.settings ?? {};
    const brandingRaw = (organization.branding ?? {}) as Record<string, unknown>;

    return {
      session: {
        ...session,
        organization: {
          id: String(organization.id),
          name: organization.name,
          slug: organization.slug,
          planId,
        },
      },
      settings: {
        ...DEFAULT_ORG_SETTINGS,
        companyName:
          String(settingsRaw.company_name ?? organization.name ?? DEFAULT_ORG_SETTINGS.companyName),
        email: String(settingsRaw.email ?? DEFAULT_ORG_SETTINGS.email),
        phone: String(settingsRaw.phone ?? ""),
        address: String(settingsRaw.address ?? ""),
        city: String(settingsRaw.city ?? ""),
        postalCode: String(settingsRaw.postal_code ?? ""),
        country: String(settingsRaw.country ?? "Côte d'Ivoire"),
        defaultCurrency: (settingsRaw.default_currency as "XOF") ?? "XOF",
      },
      branding: {
        displayName: (brandingRaw.display_name as string | null) ?? organization.name,
        logoUrl: (brandingRaw.logo_url as string | null) ?? null,
        primaryColor: (brandingRaw.primary_color as string) ?? "#2563eb",
        accentColor: (brandingRaw.accent_color as string) ?? "#10b981",
        fontFamily: (brandingRaw.font_family as string) ?? "Inter",
        documentTemplate: "classic" as const,
        locale: (brandingRaw.locale as string) ?? "fr-CI",
        currency: (brandingRaw.currency as "XOF") ?? "XOF",
      },
      enabledModules,
      features,
      subscription: organization.subscription ?? null,
      plan: {
        id: planId,
        name:
          planId === "pro" ? "Pro" : planId === "business" ? "Business" : "Gratuit",
        price: planId === "pro" ? 15000 : planId === "business" ? 45000 : 0,
        priceLabel:
          planId === "pro"
            ? "15 000 XOF/mois"
            : planId === "business"
              ? "45 000 XOF/mois"
              : "0 XOF/mois",
        description: "",
        features: [],
        limitLabel: null,
        highlighted: planId === "pro",
        maxInvoicesPerMonth: null,
        maxClients: null,
        autoReminders: Boolean(entitlements.auto_reminders),
        onlinePayments: Boolean(entitlements.online_payments),
        pipeline: Boolean(entitlements.pipeline),
        conversations: Boolean(entitlements.conversations),
        reports: Boolean(entitlements.reports ?? true),
        expenses: Boolean(entitlements.expenses ?? true),
        catalog: Boolean(entitlements.catalog ?? true),
        importTool: Boolean(entitlements.import_tool),
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

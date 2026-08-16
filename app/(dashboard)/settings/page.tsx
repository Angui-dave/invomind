import { verifySession, getCurrentOrganization } from "@/lib/dal/session";
import {
  getBillingHistory,
  getBranding,
  getEmailTemplates,
  getEnabledModules,
  getOrgSettings,
  getSettingsExtras,
} from "@/lib/dal/settings";
import { PRICING_PLANS } from "@/lib/mock-data";
import { SettingsPageClient } from "./settings-client";

export default async function SettingsPage() {
  const session = await verifySession();
  const [{ plan }, org, extras, templates, billing, branding, modules] =
    await Promise.all([
      getCurrentOrganization(),
      getOrgSettings(),
      getSettingsExtras(),
      getEmailTemplates(),
      getBillingHistory(),
      getBranding(),
      getEnabledModules(),
    ]);

  const catalogPlan =
    PRICING_PLANS.find((p) => p.id === session.organization.planId) ??
    PRICING_PLANS[0];

  return (
    <SettingsPageClient
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        company: session.organization.name,
        plan: session.organization.planId,
      }}
      plan={catalogPlan}
      plans={PRICING_PLANS}
      planLimits={plan}
      initialOrg={{
        ...org,
        ...extras,
      }}
      initialTemplates={templates}
      billingHistory={billing}
      branding={branding}
      enabledModules={modules}
    />
  );
}

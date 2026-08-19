import { assertAdminTenant } from "@/lib/rbac/guards";
import { verifySession, getCurrentOrganization } from "@/lib/dal/session";
import {
  getBranding,
  getEmailTemplates,
  getEnabledModules,
  getOrgSettings,
  getSettingsExtras,
} from "@/lib/dal/settings";
import { PRICING_PLANS } from "@/lib/mock-data";
import { SettingsPageClient } from "./settings-client";

type SearchParams = Promise<{
  tab?: string;
}>;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await assertAdminTenant();
  const session = await verifySession();
  const [{ plan }, org, extras, templates, branding, modules, params] =
    await Promise.all([
      getCurrentOrganization(),
      getOrgSettings(),
      getSettingsExtras(),
      getEmailTemplates(),
      getBranding(),
      getEnabledModules(),
      searchParams,
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
      planLimits={plan}
      initialOrg={{
        ...org,
        ...extras,
      }}
      initialTemplates={templates}
      branding={branding}
      enabledModules={modules}
      initialTab={params.tab}
    />
  );
}

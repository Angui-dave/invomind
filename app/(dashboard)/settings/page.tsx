import { isLaravelApiEnabled } from "@/lib/config";
import { assertAdminTenant } from "@/lib/rbac/guards";
import { verifySession, getCurrentOrganization } from "@/lib/dal/session";
import { dalErrorMessage } from "@/lib/dal/load-error";
import {
  getBranding,
  getEmailTemplates,
  getEnabledModules,
  getOrgSettings,
  getSettingsExtras,
} from "@/lib/dal/settings";
import { DalErrorBanner } from "@/components/dal-error-banner";
import { PageHeader } from "@/components/dashboard/page-header";
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
  const params = await searchParams;

  let loadError: string | null = null;
  let plan: Awaited<ReturnType<typeof getCurrentOrganization>>["plan"] | null =
    null;
  let org: Awaited<ReturnType<typeof getOrgSettings>> | null = null;
  let extras: Awaited<ReturnType<typeof getSettingsExtras>> | null = null;
  let templates: Awaited<ReturnType<typeof getEmailTemplates>> = [];
  let branding: Awaited<ReturnType<typeof getBranding>> | null = null;
  let modules: Awaited<ReturnType<typeof getEnabledModules>> | null = null;

  try {
    [{ plan }, org, extras, templates, branding, modules] = await Promise.all([
      getCurrentOrganization(),
      getOrgSettings(),
      getSettingsExtras(),
      getEmailTemplates(),
      getBranding(),
      getEnabledModules(),
    ]);
  } catch (error) {
    loadError = dalErrorMessage(error);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Organisation, facturation et canaux"
      />
      {loadError ? <DalErrorBanner message={loadError} /> : null}
      {plan && org && extras && branding && modules ? (
        <SettingsPageClient
          user={{
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            company: session.organization.name,
            plan: session.organization.planId,
          }}
          plan={{
            id: plan.id,
            name: plan.name,
            price: plan.price,
            priceLabel: plan.priceLabel,
            description: plan.description,
            features: plan.features,
            ...(plan.limitLabel ? { limitLabel: plan.limitLabel } : {}),
            ...(plan.highlighted ? { highlighted: plan.highlighted } : {}),
          }}
          planLimits={plan}
          initialOrg={{
            ...org,
            ...extras,
          }}
          initialTemplates={templates}
          branding={branding}
          enabledModules={modules}
          initialTab={params.tab}
          laravelApiEnabled={isLaravelApiEnabled()}
        />
      ) : null}
    </div>
  );
}

import { listCatalogItems } from "@/lib/dal/catalog";
import { getOrgSettings } from "@/lib/dal/settings";
import { getCurrentOrganization } from "@/lib/dal/session";
import { dalErrorMessage } from "@/lib/dal/load-error";
import { DalErrorBanner } from "@/components/dal-error-banner";
import { PageHeader } from "@/components/dashboard/page-header";
import { FeatureGate } from "@/components/feature-gate";
import { getAppRole } from "@/lib/rbac/guards";
import { isAdminTenant } from "@/lib/rbac/policy";
import type { CatalogItem } from "@/lib/data/catalog";
import type { OrgSettings } from "@/lib/data/settings";
import { CatalogPageClient } from "./catalog-client";

export default async function CatalogPage() {
  const { features } = await getCurrentOrganization();
  const appRole = await getAppRole();

  let items: CatalogItem[] = [];
  let settings: OrgSettings | null = null;
  let loadError: string | null = null;

  try {
    [items, settings] = await Promise.all([
      listCatalogItems(),
      getOrgSettings(),
    ]);
  } catch (error) {
    loadError = dalErrorMessage(error);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogue"
        description="Produits et prestations facturables"
      />
      {loadError ? <DalErrorBanner message={loadError} /> : null}
      <FeatureGate
        allowed={features.catalog}
        featureLabel="Catalogue"
        showUpgradeLink={isAdminTenant(appRole)}
      >
        <CatalogPageClient
          initialItems={items}
          defaultCurrency={settings?.defaultCurrency ?? "XOF"}
        />
      </FeatureGate>
    </div>
  );
}

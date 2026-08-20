import { listCatalogItems } from "@/lib/dal/catalog";
import { getOrgSettings } from "@/lib/dal/settings";
import { getCurrentOrganization } from "@/lib/dal/session";
import { FeatureGate } from "@/components/feature-gate";
import { getAppRole } from "@/lib/rbac/guards";
import { isAdminTenant } from "@/lib/rbac/policy";
import { CatalogPageClient } from "./catalog-client";

export default async function CatalogPage() {
  const { features } = await getCurrentOrganization();
  const appRole = await getAppRole();
  const [items, settings] = await Promise.all([
    listCatalogItems(),
    getOrgSettings(),
  ]);

  return (
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
  );
}

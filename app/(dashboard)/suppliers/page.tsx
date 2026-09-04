import { listSuppliers } from "@/lib/dal/suppliers";
import { getCurrentOrganization } from "@/lib/dal/session";
import { dalErrorMessage } from "@/lib/dal/load-error";
import { DalErrorBanner } from "@/components/dal-error-banner";
import { FeatureGate } from "@/components/feature-gate";
import { getAppRole } from "@/lib/rbac/guards";
import { isAdminTenant } from "@/lib/rbac/policy";
import type { Supplier } from "@/lib/data/suppliers";
import { SuppliersPageClient } from "./suppliers-client";

export default async function SuppliersPage() {
  const { features } = await getCurrentOrganization();
  const appRole = await getAppRole();

  let suppliers: Supplier[] = [];
  let loadError: string | null = null;

  try {
    suppliers = await listSuppliers();
  } catch (error) {
    loadError = dalErrorMessage(error);
  }

  return (
    <>
      {loadError ? <DalErrorBanner message={loadError} /> : null}
      <FeatureGate
        allowed={features.expenses}
        featureLabel="Fournisseurs"
        showUpgradeLink={isAdminTenant(appRole)}
      >
        <SuppliersPageClient initialSuppliers={suppliers} />
      </FeatureGate>
    </>
  );
}

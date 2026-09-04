import { assertAdminTenant } from "@/lib/rbac/guards";
import { FeatureGate } from "@/components/feature-gate";
import { getCurrentOrganization } from "@/lib/dal/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { ImportPageClient } from "./import-client";

export default async function ImportPage() {
  await assertAdminTenant();
  const { features } = await getCurrentOrganization();
  const laravel = isLaravelApiEnabled();

  return (
    <FeatureGate
      allowed={laravel ? false : features.importTool}
      unavailable={laravel}
      featureLabel="Import CSV"
    >
      <ImportPageClient />
    </FeatureGate>
  );
}

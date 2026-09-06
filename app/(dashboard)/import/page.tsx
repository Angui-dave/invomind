import { assertAdminTenant } from "@/lib/rbac/guards";
import { FeatureGate } from "@/components/feature-gate";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentOrganization } from "@/lib/dal/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { ImportPageClient } from "./import-client";

export default async function ImportPage() {
  await assertAdminTenant();
  const { features } = await getCurrentOrganization();
  const laravel = isLaravelApiEnabled();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import CSV"
        description="Importer clients, catalogue et dépenses"
      />
      <FeatureGate
        allowed={laravel ? false : features.importTool}
        unavailable={laravel}
        featureLabel="Import CSV"
      >
        <ImportPageClient />
      </FeatureGate>
    </div>
  );
}

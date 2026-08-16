import { FeatureGate } from "@/components/feature-gate";
import { getCurrentOrganization } from "@/lib/dal/session";
import { ImportPageClient } from "./import-client";

export default async function ImportPage() {
  const { features } = await getCurrentOrganization();

  return (
    <FeatureGate allowed={features.importTool} featureLabel="Import CSV">
      <ImportPageClient />
    </FeatureGate>
  );
}

import { listExpenseCategories, listExpenses } from "@/lib/dal/expenses";
import { listSuppliers } from "@/lib/dal/suppliers";
import { getOrgSettings } from "@/lib/dal/settings";
import { getCurrentOrganization } from "@/lib/dal/session";
import { FeatureGate } from "@/components/feature-gate";
import { getAppRole } from "@/lib/rbac/guards";
import { isAdminTenant } from "@/lib/rbac/policy";
import { ExpensesPageClient } from "./expenses-client";

export default async function ExpensesPage() {
  const { features } = await getCurrentOrganization();
  const appRole = await getAppRole();
  const [expenses, categories, suppliers, settings] = await Promise.all([
    listExpenses(),
    listExpenseCategories(),
    listSuppliers(),
    getOrgSettings(),
  ]);

  return (
    <FeatureGate
      allowed={features.expenses}
      featureLabel="Dépenses"
      showUpgradeLink={isAdminTenant(appRole)}
    >
      <ExpensesPageClient
        initialExpenses={expenses}
        categories={categories}
        suppliers={suppliers}
        defaultCurrency={settings?.defaultCurrency ?? "XOF"}
      />
    </FeatureGate>
  );
}

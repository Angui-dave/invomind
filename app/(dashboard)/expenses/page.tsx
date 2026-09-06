import { listExpenseCategories, listExpenses } from "@/lib/dal/expenses";
import { listSuppliers } from "@/lib/dal/suppliers";
import { getOrgSettings } from "@/lib/dal/settings";
import { getCurrentOrganization } from "@/lib/dal/session";
import { dalErrorMessage } from "@/lib/dal/load-error";
import { DalErrorBanner } from "@/components/dal-error-banner";
import { PageHeader } from "@/components/dashboard/page-header";
import { FeatureGate } from "@/components/feature-gate";
import { getAppRole } from "@/lib/rbac/guards";
import { isAdminTenant } from "@/lib/rbac/policy";
import type { Expense, ExpenseCategory } from "@/lib/data/expenses";
import type { Supplier } from "@/lib/data/suppliers";
import type { OrgSettings } from "@/lib/data/settings";
import { ExpensesPageClient } from "./expenses-client";

export default async function ExpensesPage() {
  const { features } = await getCurrentOrganization();
  const appRole = await getAppRole();

  let expenses: Expense[] = [];
  let categories: ExpenseCategory[] = [];
  let suppliers: Supplier[] = [];
  let settings: OrgSettings | null = null;
  let loadError: string | null = null;

  try {
    [expenses, categories, suppliers, settings] = await Promise.all([
      listExpenses(),
      listExpenseCategories(),
      listSuppliers(),
      getOrgSettings(),
    ]);
  } catch (error) {
    loadError = dalErrorMessage(error);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dépenses"
        description="Charges, catégories et fournisseurs"
      />
      {loadError ? <DalErrorBanner message={loadError} /> : null}
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
    </div>
  );
}

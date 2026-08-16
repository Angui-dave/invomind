import { listExpenseCategories, listExpenses } from "@/lib/dal/expenses";
import { listSuppliers } from "@/lib/dal/suppliers";
import { getOrgSettings } from "@/lib/dal/settings";
import { ExpensesPageClient } from "./expenses-client";

export default async function ExpensesPage() {
  const [expenses, categories, suppliers, settings] = await Promise.all([
    listExpenses(),
    listExpenseCategories(),
    listSuppliers(),
    getOrgSettings(),
  ]);

  return (
    <ExpensesPageClient
      initialExpenses={expenses}
      categories={categories}
      suppliers={suppliers}
      defaultCurrency={settings?.defaultCurrency ?? "XOF"}
    />
  );
}

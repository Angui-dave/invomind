import "server-only";
import { verifySession } from "@/lib/dal/session";
import { tenantStore } from "@/lib/mock/store";
import type { Expense, ExpenseCategory } from "@/lib/data/expenses";

export async function listExpenses(): Promise<Expense[]> {
  await verifySession();
  const store = await tenantStore();
  return [...store.expenses].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
}

export async function listExpenseCategories(): Promise<ExpenseCategory[]> {
  await verifySession();
  const store = await tenantStore();
  return [...store.expenseCategories];
}

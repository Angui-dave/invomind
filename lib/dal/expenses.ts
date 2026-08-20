import "server-only";
import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { unwrapList } from "@/lib/laravel/pagination";
import { mapExpense, mapExpenseCategory } from "@/lib/laravel/mappers";
import { tenantStore } from "@/lib/mock/store";
import type { Expense, ExpenseCategory } from "@/lib/data/expenses";

export async function listExpenses(): Promise<Expense[]> {
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    const token = (await readSessionCookie())?.accessToken;
    const rows = unwrapList(
      await laravelRequest<unknown>("/expenses", {
        token,
        organizationId: session.organizationId,
      }),
    );
    return rows.map(mapExpense).sort((a, b) => b.date.localeCompare(a.date));
  }
  const store = await tenantStore();
  return [...store.expenses].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
}

export async function listExpenseCategories(): Promise<ExpenseCategory[]> {
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    const token = (await readSessionCookie())?.accessToken;
    const rows = unwrapList(
      await laravelRequest<unknown>("/expense-categories", {
        token,
        organizationId: session.organizationId,
      }),
    );
    return rows.map(mapExpenseCategory);
  }
  const store = await tenantStore();
  return [...store.expenseCategories];
}

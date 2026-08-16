import {
  billedRevenueHt,
  billedRevenueTtc,
  expensesTotalHt,
  revenueByMonth,
  totalCollected,
  vatByRate,
  vatCollected,
} from "@/lib/dal/reports";
import { getInvoices } from "@/lib/dal/documents";
import {
  listExpenseCategories,
  listExpenses,
} from "@/lib/dal/expenses";
import { getOrgSettings } from "@/lib/dal/settings";
import { sumByCurrency } from "@/lib/data/derive";
import { ReportsPageClient } from "./reports-client";

export default async function ReportsPage() {
  const [
    settings,
    invoices,
    expenses,
    categories,
    collected,
    billedTtc,
    salesHt,
    expensesHt,
    revenueSeries,
    vatCollectedAmount,
    vatRows,
  ] = await Promise.all([
    getOrgSettings(),
    getInvoices(),
    listExpenses(),
    listExpenseCategories(),
    totalCollected(),
    billedRevenueTtc(),
    billedRevenueHt(),
    expensesTotalHt(),
    revenueByMonth(12),
    vatCollected(),
    vatByRate(),
  ]);

  const currency = settings?.defaultCurrency ?? "XOF";
  const expensesTtc = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = salesHt - expensesHt;
  const vatDeductible = expenses
    .filter((e) => e.taxDeductible)
    .reduce((s, e) => s + e.taxAmount, 0);
  const vatBalance = vatCollectedAmount - vatDeductible;

  const expensesByCategory = categories
    .map((cat) => ({
      name: cat.name,
      amount: expenses
        .filter((e) => e.categoryId === cat.id)
        .reduce((s, e) => s + e.amount, 0),
      fill: cat.color,
    }))
    .filter((r) => r.amount > 0);

  const paymentsByCurrency = sumByCurrency(
    expenses.map((e) => ({ amount: e.amount, currency: e.currency })),
  );

  return (
    <ReportsPageClient
      currency={currency}
      collected={collected}
      billedTtc={billedTtc}
      salesHt={salesHt}
      expensesHt={expensesHt}
      expensesTtc={expensesTtc}
      profit={profit}
      paidInvoiceCount={invoices.filter((i) => i.status === "paid").length}
      pendingInvoiceCount={
        invoices.filter(
          (i) => i.status === "sent" || i.status === "partially_paid",
        ).length
      }
      overdueInvoiceCount={
        invoices.filter((i) => i.status === "overdue").length
      }
      revenueSeries={revenueSeries}
      expensesByCategory={expensesByCategory}
      vatCollectedAmount={vatCollectedAmount}
      vatDeductible={vatDeductible}
      vatBalance={vatBalance}
      vatRows={vatRows}
      paymentsByCurrency={paymentsByCurrency}
    />
  );
}

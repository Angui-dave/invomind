import { assertAdminTenant } from "@/lib/rbac/guards";
import {
  billedRevenueHt,
  billedRevenueTtc,
  expensesTotalHt,
  getReportsOverview,
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
import { getCurrentOrganization } from "@/lib/dal/session";
import { sumByCurrency } from "@/lib/data/derive";
import { isLaravelApiEnabled } from "@/lib/config";
import { FeatureGate } from "@/components/feature-gate";
import { ReportsPageClient } from "./reports-client";

export default async function ReportsPage() {
  await assertAdminTenant();
  const { features } = await getCurrentOrganization();
  const overview = isLaravelApiEnabled() ? await getReportsOverview() : null;

  const [
    settings,
    invoices,
    expenses,
    categories,
    collectedFallback,
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
  const collected = overview
    ? Number(overview.total_revenue)
    : collectedFallback;
  const expensesTtc = overview
    ? Number(overview.total_expenses)
    : expenses.reduce((s, e) => s + e.amount, 0);
  const profit = overview ? Number(overview.net_profit) : salesHt - expensesHt;
  const vatDeductible = expenses
    .filter((e) => e.taxDeductible)
    .reduce((s, e) => s + e.taxAmount, 0);
  const paidInvoiceCount = overview?.paid_invoice_count
    ?? invoices.filter((i) => i.status === "paid").length;
  const pendingInvoiceCount =
    overview?.pending_invoice_count ??
    invoices.filter(
      (i) => i.status === "sent" || i.status === "partially_paid",
    ).length;
  const overdueInvoiceCount =
    overview?.overdue_invoice_count ??
    invoices.filter((i) => i.status === "overdue").length;
  const vatBalance = vatCollectedAmount - vatDeductible;

  const expensesByCategory =
    overview && overview.expenses_by_category.length > 0
      ? overview.expenses_by_category.map((row) => {
          const cat = categories.find((c) => c.name === row.category);
          return {
            name: row.category,
            amount: Number(row.total),
            fill: cat?.color ?? "#64748b",
          };
        })
      : categories
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
    <FeatureGate allowed={features.reports} featureLabel="Rapports">
      <ReportsPageClient
        currency={currency}
        collected={collected}
        billedTtc={billedTtc}
        salesHt={salesHt}
        expensesHt={expensesHt}
        expensesTtc={expensesTtc}
        profit={profit}
        paidInvoiceCount={paidInvoiceCount}
        pendingInvoiceCount={pendingInvoiceCount}
        overdueInvoiceCount={overdueInvoiceCount}
        revenueSeries={revenueSeries}
        expensesByCategory={expensesByCategory}
        vatCollectedAmount={vatCollectedAmount}
        vatDeductible={vatDeductible}
        vatBalance={vatBalance}
        vatRows={vatRows}
        paymentsByCurrency={paymentsByCurrency}
      />
    </FeatureGate>
  );
}

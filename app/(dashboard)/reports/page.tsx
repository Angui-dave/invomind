import { assertAdminTenant } from "@/lib/rbac/guards";
import {
  billedRevenueHt,
  billedRevenueTtc,
  countInvoicesByBucket,
  expensesTotalHt,
  expensesTotalTtc,
  getReportsOverview,
  netProfitTtc,
  revenueByMonth,
  totalCollected,
  vatByRate,
  vatCollected,
} from "@/lib/dal/reports";
import { listExpenseCategories, listExpenses } from "@/lib/dal/expenses";
import { listPayments } from "@/lib/dal/payments";
import { getOrgSettings } from "@/lib/dal/settings";
import { getCurrentOrganization } from "@/lib/dal/session";
import { dalErrorMessage } from "@/lib/dal/load-error";
import {
  expenseTtc,
  isValidatedExpense,
  sumByCurrency,
} from "@/lib/data/derive";
import { isLaravelApiEnabled } from "@/lib/config";
import { DalErrorBanner } from "@/components/dal-error-banner";
import { PageHeader } from "@/components/dashboard/page-header";
import { FeatureGate } from "@/components/feature-gate";
import { ReportsPageClient } from "./reports-client";

export default async function ReportsPage() {
  await assertAdminTenant();
  const { features } = await getCurrentOrganization();

  let loadError: string | null = null;
  let overview: Awaited<ReturnType<typeof getReportsOverview>> | null = null;
  let settings: Awaited<ReturnType<typeof getOrgSettings>> | null = null;
  let expenses: Awaited<ReturnType<typeof listExpenses>> = [];
  let categories: Awaited<ReturnType<typeof listExpenseCategories>> = [];
  let payments: Awaited<ReturnType<typeof listPayments>> = [];
  let collected = 0;
  let billedTtc = 0;
  let salesHt = 0;
  let expensesHt = 0;
  let expensesTtc = 0;
  let profit = 0;
  let revenueSeries: Awaited<ReturnType<typeof revenueByMonth>> = [];
  let vatCollectedAmount = 0;
  let vatRows: Awaited<ReturnType<typeof vatByRate>> = [];
  let paidInvoiceCount = 0;
  let pendingInvoiceCount = 0;
  let overdueInvoiceCount = 0;

  try {
    overview = isLaravelApiEnabled() ? await getReportsOverview() : null;
    const buckets = await countInvoicesByBucket();
    [
      settings,
      expenses,
      categories,
      payments,
      collected,
      billedTtc,
      salesHt,
      expensesHt,
      expensesTtc,
      profit,
      revenueSeries,
      vatCollectedAmount,
      vatRows,
    ] = await Promise.all([
      getOrgSettings(),
      listExpenses(),
      listExpenseCategories(),
      listPayments(),
      totalCollected(),
      billedRevenueTtc(),
      billedRevenueHt(),
      expensesTotalHt(),
      expensesTotalTtc(),
      netProfitTtc(),
      revenueByMonth(12),
      vatCollected(),
      vatByRate(),
    ]);
    paidInvoiceCount = buckets.paid;
    pendingInvoiceCount = buckets.pending;
    overdueInvoiceCount = buckets.overdue;

    if (overview) {
      collected = Number(overview.total_revenue);
      expensesTtc = Number(overview.total_expenses);
      profit = Number(overview.net_profit);
      if (overview.paid_invoice_count != null) {
        paidInvoiceCount = Number(overview.paid_invoice_count);
      }
      if (overview.pending_invoice_count != null) {
        pendingInvoiceCount = Number(overview.pending_invoice_count);
      }
      if (overview.overdue_invoice_count != null) {
        overdueInvoiceCount = Number(overview.overdue_invoice_count);
      }
    }
  } catch (error) {
    loadError = dalErrorMessage(error);
  }

  const currency = settings?.defaultCurrency ?? "XOF";
  const validatedExpenses = expenses.filter(isValidatedExpense);
  const vatDeductible = validatedExpenses
    .filter((e) => e.taxDeductible)
    .reduce((s, e) => s + e.taxAmount, 0);
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
            amount: validatedExpenses
              .filter((e) => e.categoryId === cat.id)
              .reduce((s, e) => s + expenseTtc(e), 0),
            fill: cat.color,
          }))
          .filter((r) => r.amount > 0);

  const paymentsByCurrency = sumByCurrency(
    payments.map((p) => ({ amount: p.amount, currency: p.currency })),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapports"
        description="Vue d’ensemble financière"
      />
      {loadError ? <DalErrorBanner message={loadError} /> : null}
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
    </div>
  );
}

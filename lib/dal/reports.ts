import "server-only";
import { cache } from "react";
import {
  expenseHt,
  type RevenuePoint,
  type TopClientRevenue,
} from "@/lib/data/derive";
import { currentMonthKey, monthKey, todayIso } from "@/lib/date";
import { isLaravelApiEnabled } from "@/lib/config";
import { getInvoices, getCreditNotes, listClients } from "@/lib/dal/documents";
import { listPayments } from "@/lib/dal/payments";
import { listExpenses } from "@/lib/dal/expenses";
import { laravelRequest } from "@/lib/laravel/client";
import { getApiContext } from "@/lib/laravel/context";
import { computeTotals } from "@/lib/tax";
import { invoiceStatusFromApi } from "@/lib/laravel/enums";
import type { InvoiceStatus } from "@/lib/documents";

export type { RevenuePoint, TopClientRevenue };

const BILLABLE: InvoiceStatus[] = [
  "sent",
  "partially_paid",
  "paid",
  "overdue",
];

const MONTH_LABELS_FR: Record<string, string> = {
  "01": "Jan",
  "02": "Fév",
  "03": "Mar",
  "04": "Avr",
  "05": "Mai",
  "06": "Juin",
  "07": "Juil",
  "08": "Août",
  "09": "Sep",
  "10": "Oct",
  "11": "Nov",
  "12": "Déc",
};

type ApiDashboard = {
  month_revenue: number | string;
  overdue_invoice_count: number;
  pending_invoice_count: number;
  revenue_by_month: Array<{ month: string; total: number | string }>;
  top_clients: Array<{ client_name: string; total: number | string }>;
};

type ApiOverview = {
  total_revenue: number | string;
  total_expenses: number | string;
  net_profit: number | string;
  invoices_by_status: Array<{
    status: string;
    count: number;
    total: number | string;
  }>;
  expenses_by_category: Array<{ category: string; total: number | string }>;
  billed_ht?: number | string;
  billed_ttc?: number | string;
  vat_collected?: number | string;
  vat_by_rate?: Array<{ rate: number | string; amount: number | string }>;
  paid_invoice_count?: number;
  pending_invoice_count?: number;
  overdue_invoice_count?: number;
};

function num(value: number | string | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function monthsBack(count: number): string[] {
  const [y, m] = todayIso().split("-").map(Number);
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(y, m - 1 - i, 1);
    keys.push(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    );
  }
  return keys;
}

const fetchDashboard = cache(async (): Promise<ApiDashboard> => {
  try {
    const { token, organizationId } = await getApiContext();
    const row = await laravelRequest<Partial<ApiDashboard>>("/reports/dashboard", {
      token,
      organizationId,
    });
    return {
      month_revenue: num(row.month_revenue),
      overdue_invoice_count: Number(row.overdue_invoice_count ?? 0),
      pending_invoice_count: Number(row.pending_invoice_count ?? 0),
      revenue_by_month: Array.isArray(row.revenue_by_month)
        ? row.revenue_by_month.map((item) => ({
            month: String(item.month ?? ""),
            total: num(item.total),
          }))
        : [],
      top_clients: Array.isArray(row.top_clients)
        ? row.top_clients.map((item) => ({
            client_name: String(item.client_name ?? ""),
            total: num(item.total),
          }))
        : [],
    };
  } catch (error) {
    console.error("fetchDashboard failed", error);
    return {
      month_revenue: 0,
      overdue_invoice_count: 0,
      pending_invoice_count: 0,
      revenue_by_month: [],
      top_clients: [],
    };
  }
});

const fetchOverview = cache(async (): Promise<ApiOverview> => {
  try {
    const { token, organizationId } = await getApiContext();
    const row = await laravelRequest<Partial<ApiOverview>>("/reports/overview", {
      token,
      organizationId,
    });
    return {
      total_revenue: num(row.total_revenue),
      total_expenses: num(row.total_expenses),
      net_profit: num(row.net_profit),
      invoices_by_status: Array.isArray(row.invoices_by_status)
        ? row.invoices_by_status.map((item) => ({
            status: invoiceStatusFromApi(String(item.status ?? "")),
            count: Number(item.count ?? 0),
            total: num(item.total),
          }))
        : [],
      expenses_by_category: Array.isArray(row.expenses_by_category)
        ? row.expenses_by_category
        : [],
      billed_ht: row.billed_ht,
      billed_ttc: row.billed_ttc,
      vat_collected: row.vat_collected,
      vat_by_rate: Array.isArray(row.vat_by_rate) ? row.vat_by_rate : [],
      paid_invoice_count: row.paid_invoice_count,
      pending_invoice_count: row.pending_invoice_count,
      overdue_invoice_count: row.overdue_invoice_count,
    };
  } catch (error) {
    console.error("fetchOverview failed", error);
    return {
      total_revenue: 0,
      total_expenses: 0,
      net_profit: 0,
      invoices_by_status: [],
      expenses_by_category: [],
      vat_by_rate: [],
    };
  }
});

export async function monthRevenue(): Promise<number> {
  if (isLaravelApiEnabled()) {
    const dashboard = await fetchDashboard();
    return num(dashboard.month_revenue);
  }
  const payments = await listPayments();
  const key = currentMonthKey();
  return payments
    .filter((p) => monthKey(p.paidAt) === key)
    .reduce((s, p) => s + p.amount, 0);
}

export async function revenueByMonth(
  months: 3 | 6 | 12 = 12,
): Promise<RevenuePoint[]> {
  if (isLaravelApiEnabled()) {
    const dashboard = await fetchDashboard();
    const keys = monthsBack(months);
    const byMonth = new Map(
      (dashboard.revenue_by_month ?? []).map((row) => [
        row.month,
        num(row.total),
      ]),
    );
    return keys.map((key) => {
      const [, mm] = key.split("-");
      return {
        month: key,
        label: MONTH_LABELS_FR[mm] ?? mm,
        amount: byMonth.get(key) ?? 0,
      };
    });
  }

  const payments = await listPayments();
  const keys = monthsBack(months);
  const byMonth = new Map(keys.map((k) => [k, 0]));
  for (const payment of payments) {
    const key = monthKey(payment.paidAt);
    if (byMonth.has(key)) {
      byMonth.set(key, (byMonth.get(key) ?? 0) + payment.amount);
    }
  }
  return keys.map((key) => {
    const [, mm] = key.split("-");
    return {
      month: key,
      label: MONTH_LABELS_FR[mm] ?? mm,
      amount: byMonth.get(key) ?? 0,
    };
  });
}

export async function topClients(n = 5): Promise<TopClientRevenue[]> {
  if (isLaravelApiEnabled()) {
    const dashboard = await fetchDashboard();
    return (dashboard.top_clients ?? []).slice(0, n).map((row) => ({
      clientId: `name:${row.client_name}`,
      clientName: row.client_name,
      amount: num(row.total),
    }));
  }

  const [clients, invoices] = await Promise.all([listClients(), getInvoices()]);
  return clients
    .map((c) => ({
      clientId: c.id,
      clientName: c.name,
      amount: invoices
        .filter(
          (d) =>
            d.clientId === c.id &&
            BILLABLE.includes(d.status as InvoiceStatus),
        )
        .reduce((s, d) => s + d.total, 0),
    }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n);
}

export async function totalCollected(): Promise<number> {
  if (isLaravelApiEnabled()) {
    const overview = await fetchOverview();
    return num(overview.total_revenue);
  }
  const payments = await listPayments();
  return payments.reduce((s, p) => s + p.amount, 0);
}

export async function billedRevenueHt(): Promise<number> {
  if (isLaravelApiEnabled()) {
    const overview = await fetchOverview();
    if (overview.billed_ht != null) return num(overview.billed_ht);
  }
  const invoices = await getInvoices();
  return invoices
    .filter((d) => BILLABLE.includes(d.status as InvoiceStatus))
    .reduce((s, d) => s + d.subtotalHt, 0);
}

export async function billedRevenueTtc(): Promise<number> {
  if (isLaravelApiEnabled()) {
    const overview = await fetchOverview();
    if (overview.billed_ttc != null) return num(overview.billed_ttc);
  }
  const invoices = await getInvoices();
  return invoices
    .filter((d) => BILLABLE.includes(d.status as InvoiceStatus))
    .reduce((s, d) => s + d.total, 0);
}

export async function expensesTotalHt(): Promise<number> {
  if (isLaravelApiEnabled()) {
    // Overview returns expense totals (amount); HT detail still needs lines.
    const expenses = await listExpenses();
    return expenses.reduce((s, e) => s + expenseHt(e), 0);
  }
  const expenses = await listExpenses();
  return expenses.reduce((s, e) => s + expenseHt(e), 0);
}

export async function vatCollected(): Promise<number> {
  if (isLaravelApiEnabled()) {
    const overview = await fetchOverview();
    if (overview.vat_collected != null) return num(overview.vat_collected);
  }
  const [invoices, creditNotes] = await Promise.all([
    getInvoices(),
    getCreditNotes(),
  ]);
  const fromInvoices = invoices
    .filter((d) => BILLABLE.includes(d.status as InvoiceStatus))
    .reduce((s, d) => s + d.taxTotal, 0);
  const fromCredits = creditNotes
    .filter((d) => d.status === "issued" || d.status === "applied")
    .reduce((s, d) => s + d.taxTotal, 0);
  return Math.round((fromInvoices - fromCredits) * 100) / 100;
}

export async function vatByRate(): Promise<{ rate: number; amount: number }[]> {
  if (isLaravelApiEnabled()) {
    const overview = await fetchOverview();
    if (overview.vat_by_rate && overview.vat_by_rate.length > 0) {
      return overview.vat_by_rate.map((row) => ({
        rate: num(row.rate),
        amount: Math.round(num(row.amount) * 100) / 100,
      }));
    }
  }
  const invoices = await getInvoices();
  const map = new Map<number, number>();
  for (const inv of invoices) {
    if (!BILLABLE.includes(inv.status as InvoiceStatus)) continue;
    const totals = computeTotals(inv.lines, inv.taxMode);
    for (const row of totals.breakdown) {
      map.set(row.rate, (map.get(row.rate) ?? 0) + row.taxAmount);
    }
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rate, amount]) => ({
      rate,
      amount: Math.round(amount * 100) / 100,
    }));
}

/** Optional typed access to Laravel overview (for future UI). */
export async function getReportsOverview(): Promise<ApiOverview | null> {
  if (!isLaravelApiEnabled()) return null;
  return fetchOverview();
}

import "server-only";
import {
  expenseHt,
  type RevenuePoint,
  type TopClientRevenue,
} from "@/lib/data/derive";
import { currentMonthKey, monthKey, todayIso } from "@/lib/date";
import { getInvoices, getCreditNotes, listClients } from "@/lib/dal/documents";
import { listPayments } from "@/lib/dal/payments";
import { listExpenses } from "@/lib/dal/expenses";
import { computeTotals } from "@/lib/tax";
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

export async function monthRevenue(): Promise<number> {
  const payments = await listPayments();
  const key = currentMonthKey();
  return payments
    .filter((p) => monthKey(p.paidAt) === key)
    .reduce((s, p) => s + p.amount, 0);
}

export async function revenueByMonth(
  months: 3 | 6 | 12 = 12,
): Promise<RevenuePoint[]> {
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
  const payments = await listPayments();
  return payments.reduce((s, p) => s + p.amount, 0);
}

export async function billedRevenueHt(): Promise<number> {
  const invoices = await getInvoices();
  return invoices
    .filter((d) => BILLABLE.includes(d.status as InvoiceStatus))
    .reduce((s, d) => s + d.subtotalHt, 0);
}

export async function billedRevenueTtc(): Promise<number> {
  const invoices = await getInvoices();
  return invoices
    .filter((d) => BILLABLE.includes(d.status as InvoiceStatus))
    .reduce((s, d) => s + d.total, 0);
}

export async function expensesTotalHt(): Promise<number> {
  const expenses = await listExpenses();
  return expenses.reduce((s, e) => s + expenseHt(e), 0);
}

export async function vatCollected(): Promise<number> {
  const [invoices, creditNotes] = await Promise.all([
    getInvoices(),
    getCreditNotes(),
  ]);
  const fromInvoices = invoices
    .filter((d) => BILLABLE.includes(d.status as InvoiceStatus))
    .reduce((s, d) => s + d.taxTotal, 0);
  const fromCredits = creditNotes.reduce((s, d) => s + d.taxTotal, 0);
  return Math.round((fromInvoices - fromCredits) * 100) / 100;
}

export async function vatByRate(): Promise<{ rate: number; amount: number }[]> {
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

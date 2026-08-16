/**
 * Derived selectors — all aggregates come from DOCUMENTS / PAYMENTS / EXPENSES.
 */

import type { BusinessDocument, InvoiceStatus } from "@/lib/documents";
import { computeTotals } from "@/lib/tax";
import type { CurrencyCode } from "@/lib/money";
import { currentMonthKey, monthKey, TODAY } from "@/lib/date";
import {
  applyDerivedStatus,
  DOCUMENTS,
} from "@/lib/data/documents";
import { PAYMENTS } from "@/lib/data/payments";
import { CLIENTS } from "@/lib/data/clients";
import type { Expense } from "@/lib/data/expenses";

export interface RevenuePoint {
  month: string;
  label: string;
  amount: number;
}

export interface TopClientRevenue {
  clientId: string;
  clientName: string;
  amount: number;
}

export interface CurrencySum {
  currency: CurrencyCode;
  amount: number;
}

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

export const BILLABLE_INVOICE_STATUSES: InvoiceStatus[] = [
  "sent",
  "partially_paid",
  "paid",
  "overdue",
];

export function amountPaid(documentId: string): number {
  return PAYMENTS.filter((p) => p.documentId === documentId).reduce(
    (s, p) => s + p.amount,
    0,
  );
}

export function creditedAmount(documentId: string): number {
  return DOCUMENTS.filter(
    (d) => d.kind === "credit_note" && d.sourceDocumentId === documentId,
  ).reduce((s, d) => s + d.total, 0);
}

export function balanceDue(doc: BusinessDocument): number {
  if (doc.kind !== "invoice") return 0;
  if (doc.status === "draft" || doc.status === "cancelled") return 0;
  const remaining = doc.total - amountPaid(doc.id) - creditedAmount(doc.id);
  return Math.max(0, Math.round(remaining * 100) / 100);
}

export function signedTotal(doc: BusinessDocument): number {
  return doc.kind === "credit_note" ? -doc.total : doc.total;
}

export function signedSubtotalHt(doc: BusinessDocument): number {
  return doc.kind === "credit_note" ? -doc.subtotalHt : doc.subtotalHt;
}

export function signedTaxTotal(doc: BusinessDocument): number {
  return doc.kind === "credit_note" ? -doc.taxTotal : doc.taxTotal;
}

export function derivedStatus(doc: BusinessDocument) {
  return applyDerivedStatus(doc).status;
}

export function withDerivedStatus(doc: BusinessDocument): BusinessDocument {
  return applyDerivedStatus(doc);
}

export function invoiceCountFor(clientId: string): number {
  return DOCUMENTS.filter(
    (d) => d.kind === "invoice" && d.clientId === clientId,
  ).length;
}

export function clientRevenue(clientId: string): number {
  return DOCUMENTS.filter(
    (d) =>
      d.clientId === clientId &&
      (d.kind === "invoice" || d.kind === "credit_note") &&
      (d.kind === "credit_note" ||
        BILLABLE_INVOICE_STATUSES.includes(
          applyDerivedStatus(d).status as InvoiceStatus,
        )),
  ).reduce((s, d) => s + signedTotal(d), 0);
}

export function topClients(n = 5): TopClientRevenue[] {
  return CLIENTS.map((c) => ({
    clientId: c.id,
    clientName: c.name,
    amount: clientRevenue(c.id),
  }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n);
}

function monthsBack(count: number): string[] {
  const [y, m] = TODAY.split("-").map(Number);
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(y, m - 1 - i, 1);
    const yy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    keys.push(`${yy}-${mm}`);
  }
  return keys;
}

export function revenueByMonth(months: 3 | 6 | 12 = 12): RevenuePoint[] {
  const keys = monthsBack(months);
  const byMonth = new Map<string, number>();
  for (const key of keys) byMonth.set(key, 0);

  for (const payment of PAYMENTS) {
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

export function monthRevenue(): number {
  const key = currentMonthKey();
  return PAYMENTS.filter((p) => monthKey(p.paidAt) === key).reduce(
    (s, p) => s + p.amount,
    0,
  );
}

export function invoicesIssuedThisMonth(): number {
  const key = currentMonthKey();
  return DOCUMENTS.filter(
    (d) => d.kind === "invoice" && monthKey(d.issueDate) === key,
  ).length;
}

export function sumByCurrency(
  items: { amount: number; currency: CurrencyCode }[],
): CurrencySum[] {
  const map = new Map<CurrencyCode, number>();
  for (const item of items) {
    map.set(item.currency, (map.get(item.currency) ?? 0) + item.amount);
  }
  return [...map.entries()].map(([currency, amount]) => ({ currency, amount }));
}

export function totalCollected(): number {
  return PAYMENTS.reduce((s, p) => s + p.amount, 0);
}

export function billedRevenueHt(): number {
  return DOCUMENTS.filter(
    (d) =>
      (d.kind === "invoice" &&
        BILLABLE_INVOICE_STATUSES.includes(
          applyDerivedStatus(d).status as InvoiceStatus,
        )) ||
      d.kind === "credit_note",
  ).reduce((s, d) => s + signedSubtotalHt(d), 0);
}

export function billedRevenueTtc(): number {
  return DOCUMENTS.filter(
    (d) =>
      (d.kind === "invoice" &&
        BILLABLE_INVOICE_STATUSES.includes(
          applyDerivedStatus(d).status as InvoiceStatus,
        )) ||
      d.kind === "credit_note",
  ).reduce((s, d) => s + signedTotal(d), 0);
}

export function expenseHt(expense: Expense): number {
  return expense.amount - expense.taxAmount;
}

export function expensesTotalHt(expenses: Expense[]): number {
  return expenses.reduce((s, e) => s + expenseHt(e), 0);
}

export function vatCollected(): number {
  return DOCUMENTS.filter(
    (d) =>
      (d.kind === "invoice" &&
        BILLABLE_INVOICE_STATUSES.includes(
          applyDerivedStatus(d).status as InvoiceStatus,
        )) ||
      d.kind === "credit_note",
  ).reduce((s, d) => s + signedTaxTotal(d), 0);
}

export function vatByRate(): { rate: number; amount: number }[] {
  const map = new Map<number, number>();
  const docs = DOCUMENTS.filter(
    (d) =>
      (d.kind === "invoice" &&
        BILLABLE_INVOICE_STATUSES.includes(
          applyDerivedStatus(d).status as InvoiceStatus,
        )) ||
      d.kind === "credit_note",
  );
  for (const d of docs) {
    const totals = computeTotals(d.lines, d.taxMode);
    const sign = d.kind === "credit_note" ? -1 : 1;
    for (const row of totals.breakdown) {
      map.set(row.rate, (map.get(row.rate) ?? 0) + sign * row.taxAmount);
    }
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rate, amount]) => ({
      rate,
      amount: Math.round(amount * 100) / 100,
    }));
}

export function latestOpenInvoiceToken(clientId: string): string | null {
  const open = DOCUMENTS.filter((d) => {
    if (d.kind !== "invoice" || d.clientId !== clientId) return false;
    const status = applyDerivedStatus(d).status;
    return status === "sent" || status === "partially_paid" || status === "overdue";
  }).sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  return open[0]?.portalToken ?? null;
}

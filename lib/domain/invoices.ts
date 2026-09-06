/**
 * Canonical invoice rules shared by DAL, lists, and mock.
 * Never import fixture arrays here.
 */

import type { BusinessDocument, InvoiceStatus } from "@/lib/documents";
import { todayIso } from "@/lib/date";

export const BILLABLE_INVOICE_STATUSES: InvoiceStatus[] = [
  "sent",
  "unpaid",
  "partially_paid",
  "paid",
  "overdue",
];

export const PENDING_INVOICE_STATUSES: InvoiceStatus[] = [
  "sent",
  "unpaid",
  "partially_paid",
];

export function isBillableInvoiceStatus(status: string): status is InvoiceStatus {
  return (BILLABLE_INVOICE_STATUSES as string[]).includes(status);
}

export function isOverdueInvoice(
  status: InvoiceStatus | string,
  dueDate: string,
  today = todayIso(),
): boolean {
  if (status === "overdue") return true;
  if (status === "draft" || status === "cancelled" || status === "paid") {
    return false;
  }
  return (
    PENDING_INVOICE_STATUSES.includes(status as InvoiceStatus) && dueDate < today
  );
}

export function documentBalanceDue(doc: Pick<
  BusinessDocument,
  "kind" | "status" | "total" | "amountPaid" | "balanceDue"
>): number {
  if (doc.kind !== "invoice") return 0;
  if (doc.status === "draft" || doc.status === "cancelled") return 0;
  if (doc.balanceDue != null) return doc.balanceDue;
  const paid = doc.amountPaid ?? 0;
  return Math.max(0, Math.round((doc.total - paid) * 100) / 100);
}

export function billedTtc(invoices: BusinessDocument[]): number {
  return invoices
    .filter((d) => d.kind === "invoice" && isBillableInvoiceStatus(d.status))
    .reduce((sum, d) => sum + d.total, 0);
}

export function collectedFromInvoices(invoices: BusinessDocument[]): number {
  return invoices
    .filter((d) => d.kind === "invoice")
    .reduce((sum, d) => sum + (d.amountPaid ?? 0), 0);
}

export function outstandingTtc(invoices: BusinessDocument[]): number {
  return invoices
    .filter(
      (d) =>
        d.kind === "invoice" &&
        (PENDING_INVOICE_STATUSES.includes(d.status as InvoiceStatus) ||
          d.status === "overdue"),
    )
    .reduce((sum, d) => sum + documentBalanceDue(d), 0);
}

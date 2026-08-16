import { getCreditNotes, getInvoices } from "@/lib/dal/documents";
import { listPayments } from "@/lib/dal/payments";
import { getOrgSettings } from "@/lib/dal/settings";
import type { BusinessDocument } from "@/lib/documents";
import { PaymentsPageClient } from "./payments-client";

function balanceDueFor(
  doc: BusinessDocument,
  payments: { documentId: string; amount: number }[],
  creditNotes: BusinessDocument[],
): number {
  if (doc.kind !== "invoice") return 0;
  if (doc.status === "draft" || doc.status === "cancelled") return 0;
  const paid = payments
    .filter((p) => p.documentId === doc.id)
    .reduce((s, p) => s + p.amount, 0);
  const credited = creditNotes
    .filter((d) => d.sourceDocumentId === doc.id)
    .reduce((s, d) => s + d.total, 0);
  return Math.max(0, Math.round((doc.total - paid - credited) * 100) / 100);
}

export default async function PaymentsPage() {
  const [payments, invoices, creditNotes, settings] = await Promise.all([
    listPayments(),
    getInvoices(),
    getCreditNotes(),
    getOrgSettings(),
  ]);

  const unpaid = invoices
    .filter(
      (i) =>
        i.status === "sent" ||
        i.status === "overdue" ||
        i.status === "partially_paid",
    )
    .map((inv) => ({
      ...inv,
      balanceDue: balanceDueFor(inv, payments, creditNotes),
    }))
    .filter((inv) => inv.balanceDue > 0.01);

  return (
    <PaymentsPageClient
      initialPayments={payments}
      unpaidInvoices={unpaid}
      defaultCurrency={settings?.defaultCurrency ?? "XOF"}
    />
  );
}

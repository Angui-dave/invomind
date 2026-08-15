import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { LedgerCard } from "@/components/ledger-card";
import { PaymentFlow } from "@/components/portal/payment-flow";
import { PortalHeader } from "@/components/portal/portal-header";
import {
  CURRENT_USER,
  formatDateFr,
  formatEuro,
  getInvoiceByToken,
  PAYMENT_METHOD_LABELS,
} from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Facture",
};

export default async function PortalInvoicePage(
  props: PageProps<"/f/[token]">,
) {
  const { token } = await props.params;
  const invoice = getInvoiceByToken(token);
  if (!invoice) notFound();

  const isPaid = invoice.status === "paid" || Boolean(invoice.paidOnlineAt);
  const isOverdue = invoice.status === "overdue";

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PortalHeader companyName={CURRENT_USER.company} />

      {isOverdue && !isPaid && (
        <p className="rounded-sm border border-line bg-muted/60 px-3 py-2 text-sm text-ink/75">
          Échéance dépassée le {formatDateFr(invoice.dueDate)}
        </p>
      )}

      <LedgerCard>
        <div className="space-y-5 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink/50">
                Facture
              </p>
              <p className="num mt-0.5 text-sm font-medium text-ink">
                {invoice.number}
              </p>
              <p className="mt-2 text-sm text-ink/70">
                Destinataire : {invoice.clientName}
              </p>
              <p className="num mt-0.5 text-xs text-ink/50">
                Émise le {formatDateFr(invoice.issueDate)} · Échéance{" "}
                {formatDateFr(invoice.dueDate)}
              </p>
            </div>
            <InvoiceStatusBadge status={isPaid ? "paid" : invoice.status} />
          </div>

          <ul className="space-y-2.5 border-t border-line pt-4">
            {invoice.lines.map((line) => (
              <li
                key={line.id}
                className="flex items-baseline justify-between gap-4 text-sm"
              >
                <span className="min-w-0">
                  <span className="block text-ink/85">{line.description}</span>
                  <span className="num text-xs text-ink/45">
                    {line.quantity} × {formatEuro(line.unitPrice)}
                  </span>
                </span>
                <span className="num shrink-0 font-medium text-ink">
                  {formatEuro(line.quantity * line.unitPrice)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-end justify-between border-t border-line pt-4">
            <span className="text-sm font-medium text-ink/65">Total TTC</span>
            <span className="num text-3xl font-semibold text-brass">
              {formatEuro(invoice.total)}
            </span>
          </div>
        </div>
      </LedgerCard>

      <PaymentFlow
        amount={invoice.total}
        alreadyPaid={isPaid}
        paidAtLabel={
          invoice.paidOnlineAt
            ? `Payée en ligne le ${formatDateFr(invoice.paidOnlineAt)}${
                invoice.paymentMethod
                  ? ` via ${PAYMENT_METHOD_LABELS[invoice.paymentMethod]}`
                  : ""
              }`
            : isPaid
              ? `Payée le ${formatDateFr(invoice.dueDate)}`
              : undefined
        }
      />

      <footer className="mt-auto pt-8 text-center text-xs text-line">
        Propulsé par InvoMind
      </footer>
    </div>
  );
}

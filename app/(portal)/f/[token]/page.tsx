import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { LedgerCard } from "@/components/ledger-card";
import { PaymentFlow } from "@/components/portal/payment-flow";
import { PaymentQrSection } from "@/components/invoices/payment-qr-section";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalPdfButton } from "@/components/portal/portal-pdf-button";
import { getPortalInvoiceContext } from "@/lib/dal/documents";
import { PAYMENT_METHOD_LABELS } from "@/lib/documents";
import { formatDateFr } from "@/lib/formatters";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Facture",
};

export default async function PortalInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { token } = await params;
  const { paid: paidParam } = await searchParams;
  const portalContext = await getPortalInvoiceContext(token);
  if (!portalContext) notFound();

  const {
    invoice,
    payments,
    orgSettings,
    branding,
    client,
    outstandingBalance,
    paymentStatus,
  } = portalContext;

  const companyName =
    branding?.displayName || orgSettings.companyName || "InvoMind";

  const isPaid = paymentStatus === "paid" || invoice.status === "paid";
  const isPartial = paymentStatus === "partially_paid";
  const isOverdue = invoice.status === "overdue";
  const due = isPaid ? 0 : outstandingBalance;
  const canCheckout =
    invoice.kind === "invoice" &&
    invoice.onlinePaymentEnabled &&
    !isPaid;
  const hasReceipt = payments.length > 0;
  const returningFromPsp = paidParam === "1";

  const latestPayment = payments[0];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PortalHeader
        companyName={companyName}
        logoUrl={branding?.logoUrl ?? null}
      />

      {isOverdue && !isPaid && (
        <p className="rounded-2xl border border-brick/30 bg-brick/10 px-4 py-3 text-sm text-brick">
          Échéance dépassée le {formatDateFr(invoice.dueDate)}
        </p>
      )}

      {isPaid && (
        <p className="rounded-2xl border border-brass/30 bg-brass/10 px-4 py-3 text-sm text-brass">
          Facture payée
        </p>
      )}

      {isPartial && due > 0 && (
        <p className="rounded-2xl border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-ink">
          Solde restant :{" "}
          <span className="num font-medium">
            {formatMoney(due, invoice.currency)}
          </span>
        </p>
      )}

      <LedgerCard className="overflow-hidden rounded-3xl" perforated={false}>
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
            <InvoiceStatusBadge
              status={isPaid ? "paid" : isPartial ? "partially_paid" : invoice.status}
            />
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
                    {line.quantity} ×{" "}
                    {formatMoney(line.unitPrice, invoice.currency)}
                  </span>
                </span>
                <span className="num shrink-0 font-medium text-ink">
                  {formatMoney(
                    line.quantity * line.unitPrice,
                    invoice.currency,
                  )}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-end justify-between border-t border-line pt-4">
            <span className="text-sm font-medium text-ink/65">Total TTC</span>
            <span className="num text-3xl font-semibold text-brass">
              {formatMoney(invoice.total, invoice.currency)}
            </span>
          </div>
        </div>
      </LedgerCard>

      {(canCheckout || isPaid || returningFromPsp) && (
        <PaymentFlow
          token={token}
          amount={due > 0 ? due : invoice.total}
          currency={invoice.currency}
          alreadyPaid={isPaid}
          initialStatus={paymentStatus}
          returningFromPsp={returningFromPsp && !isPaid}
          paidAtLabel={
            invoice.paidOnlineAt
              ? `Payée en ligne le ${formatDateFr(invoice.paidOnlineAt)}${
                  invoice.paymentMethod
                    ? ` via ${PAYMENT_METHOD_LABELS[invoice.paymentMethod]}`
                    : ""
                }`
              : latestPayment
                ? `Payée le ${formatDateFr(latestPayment.paidAt)}`
                : isPaid
                  ? `Payée le ${formatDateFr(invoice.dueDate)}`
                  : undefined
          }
        />
      )}

      {!isPaid && invoice.kind === "invoice" && (
        <PaymentQrSection
          document={invoice}
          orgSettings={orgSettings}
          client={client}
        />
      )}

      <PortalPdfButton
        href={`/api/portal/${token}/pdf`}
        label="Télécharger la facture"
      />

      {hasReceipt && !isPaid && (
        <PortalPdfButton
          href={`/api/portal/${token}/receipt`}
          label="Télécharger le reçu"
        />
      )}

      <footer className="mt-auto pt-8 text-center text-xs text-ink/40">
        Propulsé par InvoMind
      </footer>
    </div>
  );
}

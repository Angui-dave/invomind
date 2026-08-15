import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { LedgerCard } from "@/components/ledger-card";
import {
  CURRENT_USER,
  formatDateFr,
  formatEuro,
  HERO_INVOICE,
} from "@/lib/mock-data";

export function HeroInvoiceMock() {
  const invoice = HERO_INVOICE;

  return (
    <LedgerCard
      tilt="right"
      className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
      aria-hidden
    >
      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-serif text-base font-semibold text-ink">
              {CURRENT_USER.company}
            </p>
            <p className="mt-0.5 text-xs text-ink/55">{CURRENT_USER.email}</p>
          </div>
          <InvoiceStatusBadge status={invoice.status} />
        </div>

        <div className="border-t border-dashed border-line pt-4">
          <p className="text-xs uppercase tracking-wide text-ink/50">Facture</p>
          <p className="num mt-0.5 text-sm font-medium text-ink">
            {invoice.number}
          </p>
          <p className="mt-1 text-sm text-ink/70">
            Pour {invoice.clientName}
          </p>
          <p className="num mt-0.5 text-xs text-ink/50">
            Échéance {formatDateFr(invoice.dueDate)}
          </p>
        </div>

        <ul className="space-y-2 border-t border-line pt-4">
          {invoice.lines.map((line) => (
            <li
              key={line.id}
              className="flex items-baseline justify-between gap-4 text-sm"
            >
              <span className="min-w-0 truncate text-ink/80">
                {line.description}
              </span>
              <span className="num shrink-0 text-ink">
                {formatEuro(line.quantity * line.unitPrice)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-end justify-between border-t border-line pt-4">
          <span className="text-sm font-medium text-ink/70">Total TTC</span>
          <span className="num text-2xl font-semibold text-brass">
            {formatEuro(invoice.total)}
          </span>
        </div>

        <div className="rounded-sm bg-ledger px-3 py-2.5 text-center text-sm font-medium text-paper">
          Payer maintenant
        </div>
      </div>
    </LedgerCard>
  );
}

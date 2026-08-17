"use client";

import { useEffect, useState } from "react";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { formatDateFr, formatMoney } from "@/lib/mock-data";

const DEMO_INVOICE = {
  number: "FAC-2026-088",
  clientName: "Aminata Diallo",
  currency: "XOF" as const,
  dueDate: "2026-08-31",
  total: 1_846_800,
  lines: [
    {
      id: "l1",
      description: "Refonte site vitrine — phase design",
      quantity: 1,
      unitPrice: 1_200_000,
    },
    {
      id: "l2",
      description: "Intégration pages clés",
      quantity: 8,
      unitPrice: 45_000,
    },
  ],
};

const CYCLE = ["sent", "partially_paid", "paid"] as const;

export function HeroInvoiceMock() {
  const invoice = DEMO_INVOICE;
  const [step, setStep] = useState(0);
  const status = CYCLE[step];
  const paidRatio = step === 0 ? 0 : step === 1 ? 0.4 : 1;
  const paid = Math.round(invoice.total * paidRatio);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const id = window.setInterval(() => {
      setStep((current) => (current + 1) % CYCLE.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="glass-card relative overflow-hidden rounded-3xl">
      <div className="flex items-center justify-between border-b border-line/80 bg-slate-50/70 px-5 py-3">
        <div>
          <p className="font-serif text-sm font-semibold text-ink">
            Atelier Diallo
          </p>
          <p className="text-[11px] text-ink/50">Portail client · sans compte</p>
        </div>
        <InvoiceStatusBadge status={status} />
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-ink/45">
            Facture
          </p>
          <p className="num mt-0.5 text-sm font-medium text-ink">
            {invoice.number}
          </p>
          <p className="mt-1 text-sm text-ink/70">Pour {invoice.clientName}</p>
          <p className="num mt-0.5 text-xs text-ink/50">
            Échéance {formatDateFr(invoice.dueDate)}
          </p>
        </div>

        <ul className="space-y-2 border-t border-line/80 pt-4">
          {invoice.lines.map((line) => (
            <li
              key={line.id}
              className="flex items-baseline justify-between gap-4 text-sm"
            >
              <span className="min-w-0 truncate text-ink/80">
                {line.description}
              </span>
              <span className="num shrink-0 text-ink">
                {formatMoney(line.quantity * line.unitPrice, invoice.currency)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-end justify-between border-t border-line/80 pt-4">
          <span className="text-sm font-medium text-ink/70">Total TTC</span>
          <span className="num text-2xl font-semibold text-ink">
            {formatMoney(invoice.total, invoice.currency)}
          </span>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-ink/55">
            <span>Encaissé</span>
            <span className="num">
              {formatMoney(paid, invoice.currency)} · {Math.round(paidRatio * 100)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brass to-ledger transition-all duration-700"
              style={{ width: `${paidRatio * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {["Wave", "Orange Money", "Carte"].map((method) => (
            <span
              key={method}
              className="rounded-full border border-line bg-paper px-2 py-1.5 text-center text-[11px] font-medium text-ink/70"
            >
              {method}
            </span>
          ))}
        </div>

        <div
          className={
            status === "paid"
              ? "rounded-2xl bg-brass px-3 py-2.5 text-center text-sm font-medium text-paper"
              : "rounded-2xl bg-ledger px-3 py-2.5 text-center text-sm font-medium text-paper"
          }
        >
          {status === "paid"
            ? "Paiement reçu"
            : status === "partially_paid"
              ? "Acompte reçu — soldé le reste"
              : "Payer maintenant"}
        </div>
      </div>
    </div>
  );
}

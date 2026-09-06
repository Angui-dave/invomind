"use client";

import { useEffect, useRef, useState } from "react";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { LedgerCard } from "@/components/ledger-card";
import { formatDateFr } from "@/lib/formatters";
import {
  HERO_STATUS_CYCLE,
  HERO_STATUS_LABELS,
  nextHeroStep,
  paidRatioForStep,
  stubCopyForStep,
  type HeroInvoiceStatus,
} from "@/lib/marketing/hero-invoice-cycle";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

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

export function HeroInvoiceMock() {
  const invoice = DEMO_INVOICE;
  const [step, setStep] = useState(0);
  const userPaused = useRef(false);
  const status = HERO_STATUS_CYCLE[step];
  const paidRatio = paidRatioForStep(step);
  const paid = Math.round(invoice.total * paidRatio);
  const stub = stubCopyForStep(step);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const id = window.setInterval(() => {
      if (userPaused.current) return;
      setStep((current) => nextHeroStep(current));
    }, 2800);

    return () => window.clearInterval(id);
  }, []);

  function selectStatus(next: HeroInvoiceStatus) {
    userPaused.current = true;
    const index = HERO_STATUS_CYCLE.indexOf(next);
    if (index >= 0) setStep(index);
  }

  return (
    <LedgerCard
      perforated={false}
      className="overflow-hidden rounded-sm border-line/90 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.22)]"
    >
      <div className="border-b border-dashed border-line/80">
        <div className="flex items-center justify-between border-b border-line/80 bg-muted/40 px-5 py-3">
          <div>
            <p className="font-serif text-sm font-semibold text-ink">
              Atelier Diallo
            </p>
            <p className="folio-mark mt-0.5 normal-case tracking-normal">
              Portail client · sans compte
            </p>
          </div>
          <InvoiceStatusBadge status={status} />
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div
            role="group"
            aria-label="État de la facture"
            className="flex border border-line/80 bg-paper p-1"
          >
            {HERO_STATUS_CYCLE.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => selectStatus(id)}
                onFocus={() => {
                  userPaused.current = true;
                }}
                aria-pressed={status === id}
                className={cn(
                  "flex-1 px-2 py-1.5 text-xs font-semibold transition-ledger",
                  status === id
                    ? "bg-ledger text-paper"
                    : "text-ink/60 hover:text-ink",
                )}
              >
                {HERO_STATUS_LABELS[id]}
              </button>
            ))}
          </div>

          <div>
            <p className="folio-mark">Facture</p>
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
                {formatMoney(paid, invoice.currency)} ·{" "}
                {Math.round(paidRatio * 100)}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  stub.isPaid ? "bg-brass" : "bg-ledger",
                )}
                style={{ width: `${paidRatio * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "ledger-perf border-t border-line/60 px-5 pb-5 pt-5 sm:px-6",
          stub.isPaid ? "bg-brass/8" : "bg-muted/30",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="folio-mark folio-mark-accent">Talon paiement</p>
            <p className="mt-1 text-sm font-medium text-ink">{stub.method}</p>
          </div>
          {stub.isPaid && (
            <p className="num shrink-0 text-sm font-semibold text-brass">
              +{formatMoney(paid, invoice.currency)}
            </p>
          )}
        </div>

        <div
          className={cn(
            "mt-4 rounded-sm px-3 py-2.5 text-center text-sm font-medium transition-ledger",
            stub.isPaid ? "bg-brass text-paper" : "bg-ledger text-paper",
          )}
        >
          {stub.action}
        </div>
      </div>
    </LedgerCard>
  );
}

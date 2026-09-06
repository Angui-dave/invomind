"use client";

import { useState } from "react";
import { CheckCircle2, Wallet } from "lucide-react";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export function PortalShowcase() {
  const [activeTab, setActiveTab] = useState<"wave" | "om" | "card">("wave");

  return (
    <div className="overflow-hidden border border-line/90 bg-paper shadow-[0_8px_28px_-12px_rgba(15,23,42,0.18)]">
      <div className="flex items-center justify-between gap-3 border-b border-line/80 bg-muted/40 px-4 py-2.5">
        <p className="num truncate text-[11px] text-ink/55">
          invomind.app/f/8k2n-atelier
        </p>
        <span className="folio-mark folio-mark-accent shrink-0">
          Portail sécurisé
        </span>
      </div>

      <div className="border-b border-dashed border-line/80 px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-serif text-base font-semibold text-ink">
              Atelier Diallo
            </p>
            <p className="mt-0.5 text-xs text-ink/50">Dakar, SN</p>
            <p className="num mt-2 text-xs text-ink/60">
              FAC-2026-014 · Aminata Diallo
            </p>
          </div>
          <InvoiceStatusBadge status="sent" />
        </div>

        <ul className="mt-4 space-y-2 border-t border-line/80 pt-4 text-sm">
          <li className="flex justify-between gap-4">
            <span className="text-ink/80">Refonte site vitrine</span>
            <span className="num font-medium text-ink">
              {formatMoney(1_200_000, "XOF")}
            </span>
          </li>
          <li className="flex justify-between gap-4">
            <span className="text-ink/80">Intégration pages clés</span>
            <span className="num font-medium text-ink">
              {formatMoney(360_000, "XOF")}
            </span>
          </li>
          <li className="flex justify-between gap-4 text-xs text-ink/50">
            <span>TVA 18 % (Sénégal)</span>
            <span className="num">{formatMoney(286_800, "XOF")}</span>
          </li>
        </ul>

        <div className="mt-4 flex items-end justify-between border-t border-line/80 pt-4">
          <p className="folio-mark">Montant net à payer</p>
          <p className="num text-xl font-semibold text-ink">
            {formatMoney(1_846_800, "XOF")}
          </p>
        </div>
      </div>

      <div className="ledger-perf bg-muted/30 px-5 pb-5 pt-5 sm:px-6">
        <p className="folio-mark folio-mark-accent">Talon paiement</p>

        <div className="mt-3 flex gap-1 border border-line/80 bg-paper p-1">
          {(
            [
              ["wave", "Wave"],
              ["om", "Orange Money"],
              ["card", "Carte"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex-1 px-2 py-1.5 text-xs font-semibold transition-ledger",
                activeTab === id
                  ? "bg-ledger text-paper"
                  : "text-ink/60 hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-sm font-medium text-ink">
              {activeTab === "wave"
                ? "Paiement Wave"
                : activeTab === "om"
                  ? "Orange Money SN"
                  : "Carte Visa / Mastercard"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink/70">
              {activeTab === "wave"
                ? "Scannez le QR avec Wave ou ouvrez le lien sur votre téléphone."
                : activeTab === "om"
                  ? "Autorisez le prélèvement depuis votre compte Orange Money."
                  : "Paiement sécurisé avec confirmation bancaire."}
            </p>
            <button
              type="button"
              tabIndex={-1}
              aria-hidden
              className="mt-3 inline-flex items-center gap-2 bg-ledger px-4 py-2 text-xs font-semibold text-paper transition-ledger hover:bg-ledger/90"
            >
              <Wallet className="size-3.5" aria-hidden />
              Payer maintenant {formatMoney(1_846_800, "XOF")}
            </button>
          </div>

          <div className="flex flex-col items-center gap-1.5 border border-line bg-paper p-2">
            <FakeQr />
            <span className="num text-[10px] text-ink/55">
              QR EMV{" "}
              {activeTab === "wave"
                ? "Wave"
                : activeTab === "om"
                  ? "Orange"
                  : "Pay"}
            </span>
          </div>
        </div>

        <p className="mt-4 flex items-center gap-1.5 border-t border-line/60 pt-3 text-[11px] text-ink/50">
          <CheckCircle2 className="size-3.5 text-brass" aria-hidden />
          Sans création de compte · reçu par e-mail
        </p>
      </div>
    </div>
  );
}

function FakeQr() {
  const size = 11;
  const cells = Array.from({ length: size * size }, (_, i) => {
    const x = i % size;
    const y = Math.floor(i / size);
    const inFinder = (ox: number, oy: number) => {
      const dx = Math.abs(x - ox);
      const dy = Math.abs(y - oy);
      return (
        dx <= 2 && dy <= 2 && (dx === 2 || dy === 2 || (dx === 0 && dy === 0))
      );
    };
    if (inFinder(2, 2) || inFinder(size - 3, 2) || inFinder(2, size - 3)) {
      return true;
    }
    return (x * 3 + y * 7 + x * y) % 3 === 0;
  });

  return (
    <div
      className="grid size-[88px] grid-cols-[repeat(11,minmax(0,1fr))] gap-px border border-line bg-paper p-1"
      aria-hidden
    >
      {cells.map((on, i) => (
        <span key={i} className={on ? "bg-ink" : "bg-paper"} />
      ))}
    </div>
  );
}

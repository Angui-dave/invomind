import { Check, FileText, Link2, QrCode } from "lucide-react";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { LedgerCard } from "@/components/ledger-card";
import { formatMoney } from "@/lib/mock-data";

export function PortalShowcase() {
  return (
    <LedgerCard className="overflow-hidden" tilt={false}>
      <div className="flex items-center gap-1.5 border-b border-line bg-muted/50 px-3 py-2">
        <span className="size-2 rounded-full bg-brick/70" />
        <span className="size-2 rounded-full bg-brass/70" />
        <span className="size-2 rounded-full bg-ledger/70" />
        <p className="num ml-2 truncate text-[11px] text-ink/50">
          invomind.app/f/8k2n-atelier
        </p>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink/50">
                Facture
              </p>
              <p className="num mt-0.5 text-sm font-medium text-ink">
                FAC-2026-014
              </p>
              <p className="mt-1 text-sm text-ink/70">Aminata Diallo</p>
            </div>
            <InvoiceStatusBadge status="sent" />
          </div>
          <ul className="space-y-1.5 border-t border-line pt-3 text-sm">
            <li className="flex justify-between gap-3">
              <span className="text-ink/70">Refonte site vitrine</span>
              <span className="num text-ink">
                {formatMoney(1_200_000, "XOF")}
              </span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-ink/70">Intégration pages clés</span>
              <span className="num text-ink">{formatMoney(360_000, "XOF")}</span>
            </li>
          </ul>
          <div className="flex items-end justify-between border-t border-line pt-3">
            <span className="text-sm text-ink/65">Total TTC</span>
            <span className="num text-xl font-semibold text-brass">
              {formatMoney(1_846_800, "XOF")}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-sm bg-ledger px-3 py-2 text-sm font-medium text-paper">
            <Link2 className="size-3.5" aria-hidden />
            Payer maintenant — Wave / carte
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-sm border border-line bg-paper p-3">
          <FakeQr />
          <p className="flex items-center gap-1 text-[11px] text-ink/55">
            <QrCode className="size-3" aria-hidden />
            QR EMV · Wave
          </p>
        </div>
      </div>
      <p className="flex items-center gap-1.5 border-t border-line px-5 py-2.5 text-xs text-ink/55">
        <FileText className="size-3.5 text-ledger" aria-hidden />
        Aucun compte à créer. Lien unique, paiement immédiat.
      </p>
    </LedgerCard>
  );
}

function FakeQr() {
  const size = 13;
  const cells = Array.from({ length: size * size }, (_, i) => {
    const x = i % size;
    const y = Math.floor(i / size);
    const inFinder = (ox: number, oy: number) => {
      const dx = Math.abs(x - ox);
      const dy = Math.abs(y - oy);
      return dx <= 3 && dy <= 3 && (dx === 3 || dy === 3 || (dx <= 1 && dy <= 1));
    };
    if (inFinder(3, 3) || inFinder(size - 4, 3) || inFinder(3, size - 4)) {
      return true;
    }
    return (x * 3 + y * 5 + x * y) % 4 === 0;
  });

  return (
    <div
      className="grid size-[112px] grid-cols-[repeat(13,minmax(0,1fr))] gap-px bg-paper p-1"
      aria-hidden
    >
      {cells.map((on, i) => (
        <span key={i} className={on ? "bg-ink" : "bg-paper"} />
      ))}
    </div>
  );
}

export function InvoiceLifecycleMock() {
  const docs = [
    { kind: "Devis", number: "DEV-2026-008", status: "accepted" as const },
    { kind: "Facture", number: "FAC-2026-014", status: "sent" as const },
    { kind: "Avoir", number: "AV-2026-002", status: "issued" as const },
  ];

  return (
    <LedgerCard className="p-5" tilt={false}>
      <p className="text-xs uppercase tracking-wide text-ink/50">
        Cycle de vente
      </p>
      <ol className="mt-4 space-y-3">
        {docs.map((doc, index) => (
          <li
            key={doc.number}
            className="flex items-center justify-between gap-3 rounded-sm border border-line px-3 py-2.5"
          >
            <div className="flex items-center gap-3">
              <span className="num flex size-6 items-center justify-center rounded-sm border border-line text-xs text-ink/70">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-ink">{doc.kind}</p>
                <p className="num text-xs text-ink/50">{doc.number}</p>
              </div>
            </div>
            <InvoiceStatusBadge status={doc.status} />
          </li>
        ))}
      </ol>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-ledger">
        <Check className="size-3.5" aria-hidden />
        Conversion devis → facture en un clic, numérotation chrono.
      </p>
    </LedgerCard>
  );
}

export function RemindersShowcase() {
  const steps = [
    { label: "J-3 avant échéance", state: "sent", date: "28 août" },
    { label: "J+3 après échéance", state: "scheduled", date: "3 sept." },
    { label: "J+7 après échéance", state: "scheduled", date: "7 sept." },
    { label: "J+14 après échéance", state: "disabled", date: "14 sept." },
  ] as const;

  return (
    <LedgerCard className="p-5" tilt={false}>
      <p className="text-xs uppercase tracking-wide text-ink/50">
        Scénario de relance
      </p>
      <ol className="relative mt-4 space-y-0 border-l border-line pl-4">
        {steps.map((step) => (
          <li key={step.label} className="relative pb-4 last:pb-0">
            <span
              className={
                step.state === "sent"
                  ? "absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-brass"
                  : step.state === "scheduled"
                    ? "absolute -left-[21px] top-1.5 size-2.5 rounded-full border border-ledger bg-paper"
                    : "absolute -left-[21px] top-1.5 size-2.5 rounded-full border border-line bg-paper"
              }
              aria-hidden
            />
            <p className="text-sm font-medium text-ink">{step.label}</p>
            <p className="mt-0.5 text-xs text-ink/50">
              {step.state === "sent"
                ? `Envoyée le ${step.date}`
                : step.state === "scheduled"
                  ? `Programmée le ${step.date}`
                  : "Désactivée sur cette facture"}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-ink/55">
        Variables : {"{{client}}"}, {"{{montant}}"}, {"{{lien_paiement}}"}.
      </p>
    </LedgerCard>
  );
}

"use client";

import { useState } from "react";
import {
  BellRing,
  CheckCircle2,
  Kanban,
  Link2,
  MessageSquare,
  Wallet,
  Zap,
} from "lucide-react";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { formatMoney } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* 1. PORTAIL & PAIEMENT QR SHOWCASE                                          */
/* -------------------------------------------------------------------------- */
export function PortalShowcase() {
  const [activeTab, setActiveTab] = useState<"wave" | "om" | "card">("wave");

  return (
    <div className="glass-card relative overflow-hidden rounded-3xl border border-line/80 shadow-xl">
      {/* Browser Bar */}
      <div className="flex items-center justify-between border-b border-line/80 bg-slate-100/80 px-4 py-2.5 dark:bg-slate-900/80">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-brick/80" />
            <span className="size-2.5 rounded-full bg-amber/80" />
            <span className="size-2.5 rounded-full bg-brass/80" />
          </div>
          <div className="ml-2 flex items-center gap-1.5 rounded-full border border-line/60 bg-paper/90 px-3 py-0.5 text-[11px] text-ink/60 shadow-inner">
            <span className="size-1.5 rounded-full bg-brass" />
            <span className="num font-mono">https://invomind.app/f/8k2n-atelier</span>
          </div>
        </div>
        <span className="rounded-full bg-brass/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brass">
          Portail Sécurisé
        </span>
      </div>

      <div className="p-5 sm:p-6">
        {/* Invoice Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-line/70">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-serif text-base font-bold text-ink">
                Atelier Diallo
              </p>
              <span className="text-xs text-ink/40">• Dakar, SN</span>
            </div>
            <p className="num mt-0.5 text-xs text-ink/50">
              Facture <span className="font-semibold text-ink">FAC-2026-014</span> — Destinataire : Aminata Diallo
            </p>
          </div>
          <InvoiceStatusBadge status="sent" />
        </div>

        {/* Invoice Lines */}
        <ul className="py-4 space-y-2 text-sm border-b border-line/70">
          <li className="flex justify-between gap-4">
            <span className="text-ink/80">Refonte site vitrine &amp; charte graphique</span>
            <span className="num font-medium text-ink">{formatMoney(1_200_000, "XOF")}</span>
          </li>
          <li className="flex justify-between gap-4">
            <span className="text-ink/80">Intégration pages clés &amp; SEO</span>
            <span className="num font-medium text-ink">{formatMoney(360_000, "XOF")}</span>
          </li>
          <li className="flex justify-between gap-4 text-xs text-ink/50">
            <span>TVA (18% Sénégal)</span>
            <span className="num">{formatMoney(286_800, "XOF")}</span>
          </li>
        </ul>

        {/* Total & Payment Method Selector */}
        <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-ink/55 uppercase tracking-wider">Montant Net à Payer</p>
            <p className="num text-2xl font-bold text-brass">
              {formatMoney(1_846_800, "XOF")}
            </p>
          </div>

          <div className="flex rounded-full border border-line bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("wave")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                activeTab === "wave"
                  ? "bg-ledger text-paper shadow-sm"
                  : "text-ink/60 hover:text-ink",
              )}
            >
              Wave
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("om")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                activeTab === "om"
                  ? "bg-orange-500 text-paper shadow-sm"
                  : "text-ink/60 hover:text-ink",
              )}
            >
              Orange Money
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("card")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                activeTab === "card"
                  ? "bg-ink text-paper shadow-sm"
                  : "text-ink/60 hover:text-ink",
              )}
            >
              Carte
            </button>
          </div>
        </div>

        {/* Dynamic Display based on Payment Method */}
        <div className="mt-2 grid sm:grid-cols-[1fr_auto] gap-4 items-center rounded-2xl border border-line/80 bg-paper p-4 shadow-sm">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">
              {activeTab === "wave"
                ? "Paiement Wave direct"
                : activeTab === "om"
                  ? "Orange Money SN"
                  : "Carte Visa / Mastercard"}
            </p>
            <p className="text-sm text-ink/75">
              {activeTab === "wave"
                ? "Scannez le QR avec l'application Wave ou cliquez pour ouvrir l'application directement sur votre téléphone."
                : activeTab === "om"
                  ? "Tapez le code USSD ou autorisez le prélèvement depuis votre compte Orange Money."
                  : "Paiement sécurisé 3D Secure avec confirmation bancaire immédiate."}
            </p>
            <button
              type="button"
              className={cn(
                "mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-paper shadow-md transition-all hover:scale-[1.02]",
                activeTab === "wave"
                  ? "bg-ledger hover:bg-ledger/90"
                  : activeTab === "om"
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-ink hover:bg-ink/90",
              )}
            >
              <Wallet className="size-3.5" />
              Payer maintenant {formatMoney(1_846_800, "XOF")}
            </button>
          </div>

          <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-line bg-slate-50 p-2.5 dark:bg-slate-900">
            <FakeQr />
            <span className="text-[10px] font-mono font-medium text-ink/60">
              QR EMV {activeTab === "wave" ? "Wave" : activeTab === "om" ? "Orange" : "Pay"}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-ink/50 pt-2 border-t border-line/60">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="size-3.5 text-brass" /> Reçu automatique envoyé par e-mail
          </span>
          <span>Sans création de compte</span>
        </div>
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
      return dx <= 2 && dy <= 2 && (dx === 2 || dy === 2 || (dx === 0 && dy === 0));
    };
    if (inFinder(2, 2) || inFinder(size - 3, 2) || inFinder(2, size - 3)) {
      return true;
    }
    return (x * 3 + y * 7 + x * y) % 3 === 0;
  });

  return (
    <div className="grid size-[96px] grid-cols-[repeat(11,minmax(0,1fr))] gap-px bg-paper p-1 rounded-lg border border-line" aria-hidden>
      {cells.map((on, i) => (
        <span key={i} className={on ? "bg-ink rounded-[1px]" : "bg-paper"} />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. FACTURATION & DEVIS SHOWCASE                                            */
/* -------------------------------------------------------------------------- */
export function InvoiceLifecycleMock() {
  const docs = [
    {
      kind: "Devis Prospect",
      number: "DEV-2026-008",
      client: "Boulangerie Dupont",
      amount: 1_250_000,
      status: "accepted" as const,
      action: "Converti",
    },
    {
      kind: "Facture Émise",
      number: "FAC-2026-014",
      client: "Boulangerie Dupont",
      amount: 1_250_000,
      status: "sent" as const,
      action: "Lien actif",
    },
    {
      kind: "Avoir Correctif",
      number: "AV-2026-002",
      client: "Boulangerie Dupont",
      amount: 50_000,
      status: "issued" as const,
      action: "Appliqué",
    },
  ];

  return (
    <div className="glass-card overflow-hidden rounded-3xl border border-line/80 p-5 sm:p-6 shadow-xl space-y-5">
      <div className="flex items-center justify-between border-b border-line/70 pb-3">
        <div>
          <p className="font-serif text-base font-bold text-ink">Cycle Client unifié</p>
          <p className="text-xs text-ink/55">Chaîne documentaire complète sans double saisie</p>
        </div>
        <span className="rounded-full bg-ledger/12 px-2.5 py-1 text-xs font-semibold text-ledger">
          DEV → FAC → AV
        </span>
      </div>

      <ol className="space-y-3">
        {docs.map((doc, index) => (
          <li
            key={doc.number}
            className="flex items-center justify-between gap-3 rounded-2xl border border-line/80 bg-paper p-3.5 shadow-sm transition-all hover:border-ledger/40"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-mono text-xs font-bold text-ink dark:bg-slate-800">
                0{index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{doc.kind}</p>
                <p className="num text-xs text-ink/50">
                  {doc.number} • {doc.client}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="num text-sm font-bold text-ink">{formatMoney(doc.amount, "XOF")}</p>
              <div className="mt-1 flex items-center justify-end gap-1.5">
                <InvoiceStatusBadge status={doc.status} />
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-dashed border-ledger/30 bg-ledger/5 p-3.5 flex items-center gap-3">
        <Zap className="size-5 shrink-0 text-ledger" />
        <p className="text-xs text-ink/75 leading-relaxed">
          <strong>Conversion en 1 clic :</strong> Le devis accepté devient immédiatement une facture avec numéro chronologique légal et calcul auto de la TVA.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. RELANCES SHOWCASE                                                       */
/* -------------------------------------------------------------------------- */
export function RemindersShowcase() {
  const steps = [
    {
      label: "J-3 Avant Échéance",
      state: "sent",
      channel: "WhatsApp & E-mail",
      date: "28 août",
      preview: "Rappel amical : votre facture de 1 846 800 FCFA arrive bientôt à terme.",
    },
    {
      label: "J+3 Après Échéance",
      state: "scheduled",
      channel: "WhatsApp Auto",
      date: "3 sept.",
      preview: "Bonjour Aminata, sauf erreur de notre part, le règlement reste en attente.",
    },
    {
      label: "J+7 Relance Ferme",
      state: "scheduled",
      channel: "E-mail avec lien direct",
      date: "7 sept.",
      preview: "Paiement en retard. Veuillez régulariser via ce lien unique : invomind.app/f/...",
    },
  ] as const;

  return (
    <div className="glass-card overflow-hidden rounded-3xl border border-line/80 p-5 sm:p-6 shadow-xl space-y-5">
      <div className="flex items-center justify-between border-b border-line/70 pb-3">
        <div>
          <p className="font-serif text-base font-bold text-ink">Recouvrement Automatique</p>
          <p className="text-xs text-ink/55">Scénario intelligent jusqu&apos;à encaissement complet</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brass/15 px-2.5 py-1 text-xs font-semibold text-brass">
          <BellRing className="size-3.5" /> 98% encaissés
        </span>
      </div>

      <ol className="relative space-y-4 border-l-2 border-line/80 pl-5 ml-2">
        {steps.map((step) => (
          <li key={step.label} className="relative">
            <span
              className={cn(
                "absolute -left-[27px] top-1 flex size-3.5 items-center justify-center rounded-full ring-4 ring-paper",
                step.state === "sent"
                  ? "bg-brass"
                  : "border-2 border-ledger bg-paper",
              )}
            />
            <div className="rounded-2xl border border-line/80 bg-paper p-3.5 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-ink">{step.label}</span>
                <span className="text-[10px] font-semibold text-ink/50 bg-muted px-2 py-0.5 rounded-full">
                  {step.channel} • {step.date}
                </span>
              </div>
              <p className="text-xs text-ink/70 leading-relaxed italic bg-muted/40 p-2 rounded-xl">
                « {step.preview} »
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex items-center justify-between pt-1 text-xs text-ink/50">
        <span>Variables supportées : <code className="font-mono text-ledger">{"{{client}}"}</code>, <code className="font-mono text-ledger">{"{{montant}}"}</code></span>
        <span className="text-brass font-medium">Désactivable par facture</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. CRM & INBOX SHOWCASE                                                    */
/* -------------------------------------------------------------------------- */
export function CrmAndInboxShowcase() {
  const [view, setView] = useState<"kanban" | "inbox">("kanban");

  return (
    <div className="space-y-4">
      {/* Switch view buttons */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-full border border-line bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
              view === "kanban"
                ? "bg-paper text-ink shadow-sm"
                : "text-ink/60 hover:text-ink",
            )}
          >
            <Kanban className="size-3.5" /> Pipeline Prospects (Kanban)
          </button>
          <button
            type="button"
            onClick={() => setView("inbox")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
              view === "inbox"
                ? "bg-paper text-ink shadow-sm"
                : "text-ink/60 hover:text-ink",
            )}
          >
            <MessageSquare className="size-3.5" /> Inbox WhatsApp &amp; Social
          </button>
        </div>
        <span className="hidden text-xs text-ink/55 sm:inline-block">
          {view === "kanban" ? "Suivi opportunités commerciales" : "Boîte de réception centralisée"}
        </span>
      </div>

      {view === "kanban" ? (
        <div className="glass-card overflow-hidden rounded-3xl border border-line/80 p-5 shadow-xl">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Nouveau", color: "bg-slate-400", name: "Marie Dupont", company: "Boulangerie Dupont", val: 400_000 },
              { title: "Qualifié", color: "bg-ledger", name: "Karim Benali", company: "Benali Tech", val: 1_800_000 },
              { title: "Devis envoyé", color: "bg-amber", name: "Élodie Martin", company: "Cabinet Martin", val: 2_500_000 },
              { title: "Gagné", color: "bg-brass", name: "Amina Traoré", company: "Traoré Design", val: 750_000 },
            ].map((col) => (
              <div key={col.title} className="rounded-2xl border border-line/60 bg-slate-50/60 p-3 dark:bg-slate-900/60 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-line/50">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-ink">
                    <span className={cn("size-2 rounded-full", col.color)} /> {col.title}
                  </span>
                  <span className="num text-[11px] text-ink/50 font-medium">1</span>
                </div>
                <div className="rounded-xl border border-line/80 bg-paper p-3 shadow-sm hover:border-ledger/50 transition-all space-y-1">
                  <p className="text-sm font-semibold text-ink">{col.name}</p>
                  <p className="text-xs text-ink/55">{col.company}</p>
                  <p className="num mt-2 text-xs font-bold text-brass">
                    {formatMoney(col.val, "XOF")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card overflow-hidden rounded-3xl border border-line/80 p-5 shadow-xl grid sm:grid-cols-[1.1fr_1.9fr] gap-4">
          <div className="space-y-2 border-r border-line/70 pr-3 hidden sm:block">
            <p className="text-xs font-bold text-ink/60 uppercase tracking-wider pb-1">Conversations</p>
            {[
              { name: "Aminata Diallo", msg: "Avez-vous le lien Wave ?", app: "WhatsApp", active: true },
              { name: "Kofi Mensah", msg: "Merci pour la facture.", app: "Messenger", active: false },
              { name: "Karim Benali", msg: "Devis bien reçu !", app: "TikTok", active: false },
            ].map((item) => (
              <div
                key={item.name}
                className={cn(
                  "p-2.5 rounded-xl border text-xs transition-all",
                  item.active ? "border-ledger/40 bg-ledger/10 font-medium text-ink" : "border-line bg-paper text-ink/60",
                )}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-ink">{item.name}</span>
                  <span className="text-[10px] text-ledger font-semibold">{item.app}</span>
                </div>
                <p className="truncate text-[11px] mt-0.5">{item.msg}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-line/60 pb-2">
              <span className="text-sm font-bold text-ink">Aminata Diallo (WhatsApp)</span>
              <span className="text-xs text-brass font-medium">✓ En ligne</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="rounded-2xl bg-slate-100 p-3 max-w-[85%] text-ink dark:bg-slate-800">
                Bonjour ! Pouvez-vous m&apos;envoyer le lien de paiement direct ?
              </div>
              <div className="rounded-2xl bg-ledger p-3 text-paper ml-auto max-w-[85%] space-y-1 shadow-sm">
                <p>Voici votre facture FAC-2026-014 payable en 1 clic :</p>
                <div className="rounded-xl bg-paper/15 p-2 font-mono text-[11px] flex items-center justify-between">
                  <span>invomind.app/f/8k2n-atelier</span>
                  <Link2 className="size-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. DÉPENSES & TVA SHOWCASE                                                 */
/* -------------------------------------------------------------------------- */
export function ExpenseShowcase() {
  return (
    <div className="glass-card overflow-hidden rounded-3xl border border-line/80 p-5 sm:p-6 shadow-xl grid gap-5 lg:grid-cols-2 items-start">
      {/* Expenses Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-line/70 pb-2">
          <p className="font-serif text-base font-bold text-ink">Saisie des Charges &amp; Reçus</p>
          <span className="text-xs text-ink/50">Mois en cours</span>
        </div>
        <ul className="space-y-2">
          {[
            { label: "Hébergement Cloud & Serveurs", cat: "Logiciels", val: 45_000, ded: true },
            { label: "Billet d'avion mission Abidjan", cat: "Transport", val: 180_000, ded: true },
            { label: "Fournitures & consommables", cat: "Bureau", val: 32_000, ded: false },
          ].map((exp) => (
            <li
              key={exp.label}
              className="flex items-center justify-between gap-3 rounded-2xl border border-line/70 bg-paper p-3 text-xs shadow-sm"
            >
              <div>
                <p className="font-semibold text-ink">{exp.label}</p>
                <p className="text-[11px] text-ink/50 mt-0.5">
                  {exp.cat} • {exp.ded ? "TVA 18% déductible" : "Non déductible"}
                </p>
              </div>
              <span className="num font-bold text-ink">{formatMoney(exp.val, "XOF")}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* TVA Balance */}
      <div className="rounded-2xl border border-line/80 bg-paper p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-line/60 pb-2">
          <p className="text-sm font-bold text-ink">Bilan TVA &amp; Marge</p>
          <span className="rounded-full bg-brass/15 px-2 py-0.5 text-[10px] font-bold text-brass">
            Régime SN / UEMOA
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <div className="flex justify-between font-medium text-ink/70 mb-1">
              <span>TVA Collectée (Ventes)</span>
              <span className="num font-bold text-ink">{formatMoney(332_424, "XOF")}</span>
            </div>
            <div className="h-2 rounded-full bg-line overflow-hidden">
              <div className="h-full w-[82%] rounded-full bg-ledger" />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-medium text-ink/70 mb-1">
              <span>TVA Déductible (Achats)</span>
              <span className="num font-bold text-brass">{formatMoney(40_500, "XOF")}</span>
            </div>
            <div className="h-2 rounded-full bg-line overflow-hidden">
              <div className="h-full w-[22%] rounded-full bg-brass" />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-line/70 flex items-center justify-between">
          <div>
            <p className="text-xs text-ink/55">Net TVA à reverser</p>
            <p className="num text-xl font-bold text-brass">{formatMoney(291_924, "XOF")}</p>
          </div>
          <span className="text-[11px] text-ink/50 bg-muted px-2.5 py-1 rounded-xl">
            Rapport certifié pré-rempli
          </span>
        </div>
      </div>
    </div>
  );
}

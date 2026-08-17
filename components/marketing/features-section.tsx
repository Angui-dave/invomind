"use client";

import {
  Bell,
  FileText,
  Kanban,
  Receipt,
  Share2,
  Wallet,
} from "lucide-react";
import { SectionShell } from "@/components/marketing/section-shell";
import {
  InvoiceLifecycleMock,
  PortalShowcase,
  RemindersShowcase,
} from "@/components/marketing/portal-showcase";
import { CrmKanbanShowcase } from "@/components/marketing/crm-kanban-showcase";
import { OmnichannelShowcase } from "@/components/marketing/omnichannel-showcase";
import { ExpenseShowcase } from "@/components/marketing/expense-showcase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STEPS = [
  {
    n: "1",
    title: "Crée ton compte & émets",
    description:
      "Génère devis et factures conformes avec TVA automatique selon ton pays, en moins d’une minute.",
    icon: FileText,
  },
  {
    n: "2",
    title: "Partage le lien",
    description:
      "Envoie le portail client par WhatsApp, SMS ou e-mail. Aucun compte à créer pour payer.",
    icon: Share2,
  },
  {
    n: "3",
    title: "Encaisse sans friction",
    description:
      "Le client paie en un clic par Wave, Orange Money, MTN, Moov ou carte. La facture passe à payée.",
    icon: Wallet,
  },
  {
    n: "4",
    title: "Pilote & automatise",
    description:
      "Suis ta trésorerie en temps réel et laisse les relances intelligentes agir à ta place.",
    icon: Bell,
  },
] as const;

export function HowItWorksSection() {
  return (
    <SectionShell
      eyebrow="Parcours"
      title="Ton parcours en 4 étapes simples"
      description="De l’inscription à l’encaissement : un chemin clair pour prendre le contrôle de tes factures, étape par étape."
    >
      <ol className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div
          aria-hidden
          className="pointer-events-none absolute top-10 right-[12.5%] left-[12.5%] hidden h-px bg-gradient-to-r from-ledger/20 via-brass/40 to-ledger/20 lg:block"
        />
        {STEPS.map((step) => (
          <li
            key={step.n}
            className="group relative rounded-3xl border border-line/80 bg-paper p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brass/5"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-ledger to-brass text-sm font-semibold text-paper shadow-md">
                {step.n}
              </span>
              <step.icon className="size-5 text-ledger" aria-hidden />
            </div>
            <h3 className="font-serif text-lg font-semibold text-ink">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/65">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}

export function FeaturesSection() {
  return (
    <SectionShell
      id="fonctionnalites"
      alt
      eyebrow="Produit"
      title="Explore les piliers d’InvoMind"
      description="Au-delà de la facture : encaisser, relancer, convertir, piloter."
    >
      <Tabs defaultValue="portail" className="gap-6">
        <TabsList
          variant="default"
          className="h-auto w-full flex-wrap justify-start gap-1.5 rounded-full bg-muted/80 p-1.5"
        >
          <TabsTrigger
            value="facturation"
            className="rounded-full px-3.5 py-1.5 data-active:bg-paper data-active:text-ink data-active:shadow-sm"
          >
            <Receipt className="size-3.5" aria-hidden />
            Facturation &amp; devis
          </TabsTrigger>
          <TabsTrigger
            value="portail"
            className="rounded-full px-3.5 py-1.5 data-active:bg-paper data-active:text-ink data-active:shadow-sm"
          >
            Portail &amp; paiement QR
          </TabsTrigger>
          <TabsTrigger
            value="relances"
            className="rounded-full px-3.5 py-1.5 data-active:bg-paper data-active:text-ink data-active:shadow-sm"
          >
            <Bell className="size-3.5" aria-hidden />
            Relances
          </TabsTrigger>
          <TabsTrigger
            value="crm"
            className="rounded-full px-3.5 py-1.5 data-active:bg-paper data-active:text-ink data-active:shadow-sm"
          >
            <Kanban className="size-3.5" aria-hidden />
            CRM &amp; inbox
          </TabsTrigger>
          <TabsTrigger
            value="finances"
            className="rounded-full px-3.5 py-1.5 data-active:bg-paper data-active:text-ink data-active:shadow-sm"
          >
            Dépenses &amp; TVA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="facturation" className="grid gap-6 lg:grid-cols-2">
          <FeatureCopy
            title="Devis, factures, avoirs"
            body="Numérotation automatique DEV / FAC / AV, conversion devis → facture, catalogue produits et services, TVA inclusive ou exclusive."
          />
          <InvoiceLifecycleMock />
        </TabsContent>

        <TabsContent value="portail" className="grid gap-6 lg:grid-cols-2">
          <FeatureCopy
            title="Un lien. Le client paie."
            body="Portail public /f/[token], QR EMV (Wave, Orange Money, MTN, Moov, M-Pesa) ou Swiss QR-bill, carte bancaire. Aucun compte payeur."
          />
          <PortalShowcase />
        </TabsContent>

        <TabsContent value="relances" className="grid gap-6 lg:grid-cols-2">
          <FeatureCopy
            title="Recouvrement sans chasing manuel"
            body="Jalons J-3, J+3, J+7, J+14, activables facture par facture. Modèles d’e-mails avec {{client}}, {{montant}} et {{lien_paiement}}."
          />
          <RemindersShowcase />
        </TabsContent>

        <TabsContent value="crm" className="space-y-6">
          <FeatureCopy
            title="Avant et après la facture"
            body="Kanban prospects (Nouveau → Gagné), registre clients, et inbox unique WhatsApp, Instagram, Messenger, TikTok pour envoyer le lien de paiement dans le tchat."
          />
          <CrmKanbanShowcase />
          <OmnichannelShowcase />
        </TabsContent>

        <TabsContent value="finances">
          <FeatureCopy
            className="mb-6"
            title="Marge, TVA, fournisseurs"
            body="Dépenses catégorisées, déductibilité, fournisseurs, rapports ventes / charges / TVA collectée vs déductible, multi-devises natives."
          />
          <ExpenseShowcase />
        </TabsContent>
      </Tabs>
    </SectionShell>
  );
}

function FeatureCopy({
  title,
  body,
  className,
}: {
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="font-serif text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink/65">{body}</p>
    </div>
  );
}

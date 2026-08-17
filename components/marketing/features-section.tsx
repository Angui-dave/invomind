"use client";

import {
  BellRing,
  Check,
  FileText,
  Kanban,
  PieChart,
  QrCode,
  Receipt,
  Share2,
  Sparkles,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { SectionShell } from "@/components/marketing/section-shell";
import {
  CrmAndInboxShowcase,
  ExpenseShowcase,
  InvoiceLifecycleMock,
  PortalShowcase,
  RemindersShowcase,
} from "@/components/marketing/portal-showcase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    icon: BellRing,
  },
] as const;

export function HowItWorksSection() {
  return (
    <SectionShell
      id="produit"
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
      eyebrow="Fonctionnalités"
      title="Explore les piliers d’InvoMind"
      description="Une suite d'outils unifiée pour facturer, encaisser, relancer et gérer sa trésorerie sans effort."
    >
      <Tabs defaultValue="portail" className="gap-8">
        {/* Custom Rich Filter Bar */}
        <div className="overflow-x-auto pb-2">
          <TabsList
            variant="default"
            className="inline-flex h-auto w-auto items-center justify-start gap-2 rounded-full border border-line/80 bg-muted/60 p-2 shadow-inner"
          >
            <TabsTrigger
              value="facturation"
              className="group inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-ink/70 transition-all data-active:bg-paper data-active:text-ink data-active:shadow-md dark:data-active:bg-slate-800"
            >
              <Receipt className="size-4 text-ledger transition-transform group-hover:scale-110" />
              <span>Facturation &amp; devis</span>
              <span className="ml-1 rounded-full bg-ledger/10 px-2 py-0.5 text-[10px] font-bold text-ledger">
                DEV / FAC
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="portail"
              className="group inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-ink/70 transition-all data-active:bg-paper data-active:text-ink data-active:shadow-md dark:data-active:bg-slate-800"
            >
              <QrCode className="size-4 text-brass transition-transform group-hover:scale-110" />
              <span>Portail &amp; paiement QR</span>
              <span className="ml-1 rounded-full bg-brass/15 px-2 py-0.5 text-[10px] font-bold text-brass">
                Wave / OM
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="relances"
              className="group inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-ink/70 transition-all data-active:bg-paper data-active:text-ink data-active:shadow-md dark:data-active:bg-slate-800"
            >
              <BellRing className="size-4 text-amber transition-transform group-hover:scale-110" />
              <span>Relances Auto</span>
              <span className="ml-1 rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-bold text-amber">
                J-3 à J+14
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="crm"
              className="group inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-ink/70 transition-all data-active:bg-paper data-active:text-ink data-active:shadow-md dark:data-active:bg-slate-800"
            >
              <Kanban className="size-4 text-ledger transition-transform group-hover:scale-110" />
              <span>CRM &amp; Inbox</span>
              <span className="ml-1 rounded-full bg-ledger/10 px-2 py-0.5 text-[10px] font-bold text-ledger">
                Omnicanal
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="finances"
              className="group inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-ink/70 transition-all data-active:bg-paper data-active:text-ink data-active:shadow-md dark:data-active:bg-slate-800"
            >
              <PieChart className="size-4 text-brass transition-transform group-hover:scale-110" />
              <span>Dépenses &amp; TVA</span>
              <span className="ml-1 rounded-full bg-brass/15 px-2 py-0.5 text-[10px] font-bold text-brass">
                Bilan Net
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Facturation */}
        <TabsContent value="facturation" className="grid gap-8 lg:grid-cols-[1fr_1.1fr] items-center">
          <FeatureCopy
            badge="Facturation légale"
            title="Générez vos devis et factures en quelques secondes"
            body="Une interface intuitive pensée pour les professionnels indépendants et PME. Convertissez un devis accepté en facture officielle en un clic sans retaper les données."
            bullets={[
              "Numérotation chronologique conforme (DEV / FAC / AV)",
              "TVA automatique préconfigurée selon le pays (SN, CI, FR, CH...)",
              "Multi-devises natives : XOF, XAF, EUR, CHF, USD, MAD",
              "Avoirs et remises commerciales en pourcentage ou montant fixe",
            ]}
          />
          <InvoiceLifecycleMock />
        </TabsContent>

        {/* Tab 2: Portail */}
        <TabsContent value="portail" className="grid gap-8 lg:grid-cols-[1fr_1.1fr] items-center">
          <FeatureCopy
            badge="Encaissement immédiat"
            title="Un lien unique pour vous faire payer 3x plus vite"
            body="Envoyez un lien sécurisé par WhatsApp, SMS ou e-mail. Votre client ouvre le portail depuis n'importe quel appareil et règle par Wave, Orange Money ou carte bancaire."
            bullets={[
              "Paiement Mobile Money direct (Wave, Orange Money, MTN, Moov)",
              "Génération dynamique de QR Code EMV scannable",
              "Aucune création de compte requise pour le payeur",
              "Recouvrement automatique : la facture passe immédiatement à 'Payée'",
            ]}
          />
          <PortalShowcase />
        </TabsContent>

        {/* Tab 3: Relances */}
        <TabsContent value="relances" className="grid gap-8 lg:grid-cols-[1fr_1.1fr] items-center">
          <FeatureCopy
            badge="Automatisations"
            title="Fini le chasing manuel des retards de paiement"
            body="Laissez le moteur InvoMind exécuter les relances aux bons jalons. Les messages partent automatiquement par WhatsApp et e-mail avec le lien de paiement direct."
            bullets={[
              "Jalons programmables : J-3, J+3, J+7, J+14",
              "Modèles de messages personnalisables avec variables dynamiques",
              "Stop automatique dès la confirmation du paiement",
              "Désactivable en 1 clic pour des clients spécifiques",
            ]}
          />
          <RemindersShowcase />
        </TabsContent>

        {/* Tab 4: CRM & Inbox */}
        <TabsContent value="crm" className="grid gap-8 lg:grid-cols-[1fr_1.1fr] items-center">
          <FeatureCopy
            badge="CRM &amp; Messagerie"
            title="Transformez vos prospects et discutez sur une seule interface"
            body="Gérez votre pipeline commercial (Kanban) du premier contact jusqu'au closing, et répondez à tous vos messages WhatsApp, Messenger, Instagram et TikTok."
            bullets={[
              "Pipeline Kanban visuel avec montant total d'opportunités",
              "Boîte de réception omnicanale synchronisée en temps réel",
              "Insertion instantanée du lien de paiement dans la discussion",
              "Fiche contact liée à l'historique complet des factures",
            ]}
          />
          <CrmAndInboxShowcase />
        </TabsContent>

        {/* Tab 5: Dépenses & TVA */}
        <TabsContent value="finances" className="grid gap-8 lg:grid-cols-[1fr_1.1fr] items-center">
          <FeatureCopy
            badge="Comptabilité Simplifiée"
            title="Pilotez votre trésorerie et calculez votre solde de TVA"
            body="Centralisez vos dépenses d'entreprise, numérisez vos reçus et bénéficiez d'un calcul automatique de la TVA collectée vs déductible pour vos déclarations."
            bullets={[
              "Saisie et catégorisation rapide des achats &amp; fournisseurs",
              "Bilan automatisé TVA collectée / TVA déductible",
              "Calcul de la marge nette et suivi du résultat en temps réel",
              "Rapports exportables prêts pour votre comptable",
            ]}
          />
          <ExpenseShowcase />
        </TabsContent>
      </Tabs>
    </SectionShell>
  );
}

function FeatureCopy({
  badge,
  title,
  body,
  bullets,
  className,
}: {
  badge: string;
  title: string;
  body: string;
  bullets: string[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-5", className)}>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-ledger/20 bg-ledger/8 px-3 py-1 text-xs font-semibold text-ledger">
        <Sparkles className="size-3.5" />
        {badge}
      </span>
      <h3 className="font-serif text-2xl font-bold leading-tight text-ink sm:text-3xl">
        {title}
      </h3>
      <p className="text-base leading-relaxed text-ink/70">{body}</p>

      <ul className="space-y-2.5 pt-2">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2.5 text-sm text-ink/80">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brass/15 text-brass">
              <Check className="size-3.5 stroke-[2.5]" />
            </span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <div className="pt-3">
        <Link
          href="/register"
          className={cn(
            buttonVariants({ size: "lg" }),
            "glow-cta h-11 rounded-full bg-ledger px-6 text-sm text-paper hover:bg-ledger/90",
          )}
        >
          Tester cette fonctionnalité gratuitement
        </Link>
      </div>
    </div>
  );
}

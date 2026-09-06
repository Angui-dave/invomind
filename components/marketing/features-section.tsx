import { BellRing, Check, FileText, Receipt, Share2, Wallet } from "lucide-react";
import Link from "next/link";
import { SectionShell } from "@/components/marketing/section-shell";
import { PortalShowcase } from "@/components/marketing/portal-showcase";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    n: "01",
    title: "Créez le compte, émettez le devis",
    description:
      "Générez devis et factures conformes avec TVA automatique selon votre pays, en moins d’une minute.",
    icon: FileText,
  },
  {
    n: "02",
    title: "Partagez le lien",
    description:
      "Envoyez le portail client par WhatsApp, SMS ou e-mail. Aucun compte à créer pour payer.",
    icon: Share2,
  },
  {
    n: "03",
    title: "Encaissez sans friction",
    description:
      "Le client paie en un clic par Wave, Orange Money, MTN, Moov ou carte. La facture passe à payée.",
    icon: Wallet,
  },
  {
    n: "04",
    title: "Pilotez et automatisez",
    description:
      "Suivez votre trésorerie et laissez les relances planifiées agir à votre place.",
    icon: BellRing,
  },
] as const;

const PILLARS = [
  {
    icon: Receipt,
    title: "Facturation et devis",
    body: "Numérotation conforme, TVA selon le pays, multi-devises. Un devis accepté devient facture en un clic.",
    bullets: [
      "DEV / FAC avec mentions légales",
      "XOF, XAF, EUR, CHF, USD, MAD",
      "Avoirs et remises",
    ],
  },
  {
    icon: BellRing,
    title: "Relances au bon moment",
    body: "Jalons J-3, J+3, J+7, J+14 par WhatsApp et e-mail, avec le lien de paiement. Stop dès l’encaissement.",
    bullets: [
      "Modèles personnalisables",
      "Arrêt automatique si payé",
      "Désactivable client par client",
    ],
  },
  {
    icon: Wallet,
    title: "Dépenses et TVA",
    body: "Centralisez les achats, calculez TVA collectée vs déductible, et exportez un rapport pour votre comptable.",
    bullets: [
      "Catégories et fournisseurs",
      "Marge nette sur le mois",
      "Exports comptables",
    ],
  },
] as const;

export function HowItWorksSection() {
  return (
    <SectionShell
      id="produit"
      eyebrow="Parcours"
      title="Votre parcours en 4 étapes"
      description="De l’inscription à l’encaissement : un chemin clair pour prendre le contrôle de vos factures."
    >
      <ol className="divide-y divide-line/80 border border-line/80 bg-paper">
        {STEPS.map((step) => (
          <li
            key={step.n}
            className="grid gap-4 px-5 py-5 sm:grid-cols-[4.5rem_1fr_auto] sm:items-start sm:gap-6 sm:px-6"
          >
            <span className="num text-2xl font-semibold tabular-nums text-ledger">
              {step.n}
            </span>
            <div className="min-w-0">
              <h3 className="font-serif text-lg font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                {step.description}
              </p>
            </div>
            <step.icon
              className="hidden size-5 text-ink/35 sm:mt-1 sm:block"
              aria-hidden
            />
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
      wide
      eyebrow="Encaissement"
      title="Un lien unique pour vous faire payer plus vite"
      description="Envoyez un portail sécurisé. Votre client règle par Wave, Orange Money ou carte — sans créer de compte."
    >
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
        <FeatureCopy
          badge="Portail client"
          title="Le payeur ouvre le lien, scanne, et vous êtes payé"
          body="QR EMV, Mobile Money et carte sur la même page. La facture passe à payée dès la confirmation — sans recopie manuelle."
          bullets={[
            "Wave, Orange Money, MTN, Moov",
            "QR scannable, aucune app à installer côté client",
            "Recouvrement immédiat du statut de la facture",
          ]}
        />
        <PortalShowcase />
      </div>

      <ul className="mt-14 divide-y divide-line/80 border border-line/80 bg-paper">
        {PILLARS.map((pillar) => (
          <li
            key={pillar.title}
            className="grid gap-4 px-5 py-5 sm:grid-cols-[2.5rem_1fr] sm:gap-5 sm:px-6"
          >
            <span className="flex size-9 items-center justify-center border border-line/80 text-ledger">
              <pillar.icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="font-serif text-lg font-semibold text-ink">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                {pillar.body}
              </p>
              <ul className="mt-4 space-y-2 border-t border-line/80 pt-4">
                {pillar.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-start gap-2 text-sm text-ink/80"
                  >
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-brass"
                      aria-hidden
                    />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm leading-relaxed text-ink/65">
        Pipeline commercial et inbox WhatsApp, Messenger, Instagram et TikTok
        pour suivre le cycle client au même endroit — sans en faire un second
        produit.
      </p>
    </SectionShell>
  );
}

function FeatureCopy({
  badge,
  title,
  body,
  bullets,
}: {
  badge: string;
  title: string;
  body: string;
  bullets: string[];
}) {
  return (
    <div className="space-y-5">
      <span className="folio-mark folio-mark-accent">{badge}</span>
      <h3 className="font-serif text-2xl font-semibold leading-tight text-ink sm:text-3xl">
        {title}
      </h3>
      <p className="text-base leading-relaxed text-ink/70">{body}</p>
      <ul className="space-y-2.5 border-t border-line/80 pt-4">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2.5 text-sm text-ink/80">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brass/15 text-brass">
              <Check className="size-3.5 stroke-[2.5]" aria-hidden />
            </span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
      <div className="pt-2">
        <Link
          href="/register"
          className={cn(
            buttonVariants({ size: "lg" }),
            "glow-cta h-11 rounded-full bg-ledger px-6 text-sm text-paper hover:bg-ledger/90",
          )}
        >
          Créer mon compte gratuit
        </Link>
      </div>
    </div>
  );
}

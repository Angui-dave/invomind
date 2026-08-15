import Link from "next/link";
import {
  Bell,
  Check,
  CreditCard,
  Kanban,
  Link2,
  UserPlus,
  FileText,
  Ban,
} from "lucide-react";
import { HeroInvoiceMock } from "@/components/marketing/hero-invoice-mock";
import { LedgerCard } from "@/components/ledger-card";
import { buttonVariants } from "@/components/ui/button";
import { PRICING_PLANS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    n: "1",
    title: "Créer un client",
    description:
      "Enregistrez le contact une fois. Il reste dans votre registre pour chaque facture suivante.",
    icon: UserPlus,
  },
  {
    n: "2",
    title: "Générer une facture",
    description:
      "Ajoutez les lignes, activez le paiement en ligne et les relances. Le total se calcule au fur et à mesure.",
    icon: FileText,
  },
  {
    n: "3",
    title: "Être notifié du paiement",
    description:
      "Votre client paie depuis le portail. Vous êtes informé dès que le statut passe à payée.",
    icon: Bell,
  },
] as const;

const FEATURES = [
  {
    icon: CreditCard,
    title: "Paiement en ligne",
    description:
      "Bouton « Payer maintenant » sur chaque facture, carte ou Mobile Money.",
  },
  {
    icon: Bell,
    title: "Relances automatiques",
    description:
      "Jalons J-3, J+3, J+7, J+14 — activés ou désactivés facture par facture.",
  },
  {
    icon: Link2,
    title: "Portail client",
    description:
      "Un lien unique : le client consulte et paie sans créer de compte.",
  },
  {
    icon: Kanban,
    title: "Pipeline prospects",
    description:
      "Suivez les contacts avant la facture, convertissez-les en clients.",
  },
] as const;

export default function MarketingPage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-14 lg:py-24">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
            <p className="text-sm font-medium uppercase tracking-wider text-ledger">
              Facturation pour freelances
            </p>
            <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
              Facturez vite.
              <br />
              Soyez payé plus vite.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink/70 sm:text-lg">
              Clients, factures, relances et paiement en ligne — un registre
              précis pour suivre chaque euro jusqu’à l’encaissement.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-ledger text-paper hover:bg-ledger/90 h-10 px-5 text-sm",
                )}
              >
                Créer mon compte
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-10 border-line px-5 text-sm",
                )}
              >
                Se connecter
              </Link>
            </div>
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-4 rounded-sm bg-line/30 blur-2xl sm:-inset-6"
            />
            <HeroInvoiceMock />
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <h2 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
            Comment ça marche
          </h2>
          <p className="mt-2 max-w-xl text-ink/65">
            Trois gestes, du premier client au paiement confirmé.
          </p>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.n} className="relative">
                <div className="mb-3 flex items-center gap-3">
                  <span className="num flex size-8 items-center justify-center rounded-sm border border-line bg-paper text-sm font-medium text-ink">
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
        </div>
      </section>

      {/* Fonctionnalités clés */}
      <section className="border-b border-line bg-ink/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <h2 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
            Fonctionnalités clés
          </h2>
          <p className="mt-2 max-w-xl text-ink/65">
            Au-delà de la facture : encaisser, relancer, convertir.
          </p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <li
                key={feature.title}
                className="rounded-sm border border-line bg-paper p-5 transition-ledger hover:border-ink/25"
              >
                <feature.icon
                  className="size-5 text-ledger"
                  aria-hidden
                />
                <h3 className="mt-3 font-serif text-base font-semibold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-snug text-ink/65">
                  {feature.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Tarifs */}
      <section id="tarifs">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <h2 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
            Tarifs
          </h2>
          <p className="mt-2 max-w-xl text-ink/65">
            Commencez gratuitement. Passez en Pro quand le volume l’exige.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8">
            {PRICING_PLANS.map((plan) => (
              <LedgerCard
                key={plan.id}
                tilt={plan.highlighted ? "right" : "left"}
                className={cn(
                  "flex flex-col",
                  plan.highlighted && "ring-1 ring-ledger/40",
                )}
              >
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-serif text-xl font-semibold text-ink">
                      {plan.name}
                    </h3>
                    {plan.highlighted && (
                      <span className="rounded-sm bg-ledger/15 px-2 py-0.5 text-xs font-medium text-ledger">
                        Recommandé
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-ink/60">{plan.description}</p>

                  <p className="mt-5 flex items-baseline gap-1">
                    <span className="num text-3xl font-semibold text-brass">
                      {plan.priceLabel}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-sm text-ink/55">/ mois</span>
                    )}
                  </p>

                  {plan.limitLabel && (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink/70">
                      <Ban
                        className="size-3.5 shrink-0 text-brick"
                        aria-hidden
                      />
                      <span>
                        Limite :{" "}
                        <span className="num font-medium">{plan.limitLabel}</span>
                      </span>
                    </p>
                  )}

                  <ul className="mt-5 space-y-2.5 border-t border-line pt-5">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-ink/80"
                      >
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-ledger"
                          aria-hidden
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 pt-2">
                    <Link
                      href="/register"
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "h-10 w-full justify-center text-sm",
                        plan.highlighted
                          ? "bg-ledger text-paper hover:bg-ledger/90"
                          : "border border-line bg-paper text-ink hover:bg-muted",
                      )}
                    >
                      {plan.id === "free"
                        ? "Créer mon compte"
                        : "Passer au plan Pro"}
                    </Link>
                  </div>
                </div>
              </LedgerCard>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

import Link from "next/link";
import { ArrowRight, Bell, Play, Star, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { HeroInvoiceMock } from "@/components/marketing/hero-invoice-mock";
import { cn } from "@/lib/utils";

const TRUST_PILLS = [
  { value: "+10 000", label: "PME & freelances", icon: false },
  { value: "4,9 / 5", label: "sur Google", icon: true },
  { value: "10+", label: "devises (XOF, EUR, CHF)", icon: false },
] as const;

export function HeroSection() {
  return (
    <section className="hero-mesh relative overflow-x-clip border-b border-line/70">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
          <p className="inline-flex items-center gap-2 rounded-full border border-line/80 bg-paper/80 px-3 py-1 text-xs font-medium text-ink/70 shadow-sm backdrop-blur-md">
            <span className="relative flex size-2">
              <span className="pulse-dot absolute inline-flex size-full rounded-full bg-brass opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-brass" />
            </span>
            Facturation &amp; trésorerie pour freelances et PME
          </p>
          <h1 className="mt-5 font-serif text-3xl font-semibold leading-[1.12] tracking-tight text-ink sm:text-4xl lg:text-[2.85rem]">
            Transformez vos devis en{" "}
            <span className="text-gradient-brand">encaissements instantanés</span>
            .
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink/70 sm:text-lg">
            Devis, factures, relances WhatsApp et paiements par Wave, Orange
            Money, Moov, MTN ou carte. Tout le cycle client, sans friction.
          </p>
          <p className="mt-3 max-w-lg text-sm text-ink/55">
            Conçu pour la zone UEMOA, la France et la Suisse. 3 factures par
            mois, sans carte bancaire.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "glow-cta h-11 rounded-full bg-ledger px-5 text-sm text-paper hover:bg-ledger/90",
              )}
            >
              Créer mon compte gratuit
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/#fonctionnalites"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 rounded-full border-line bg-paper/70 px-5 text-sm backdrop-blur-md",
              )}
            >
              <Play className="size-3.5 fill-current" aria-hidden />
              Découvrir la démo
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap gap-2">
            {TRUST_PILLS.map((pill) => (
              <li
                key={pill.label}
                className="inline-flex items-center gap-2 rounded-full border border-line/80 bg-paper/80 px-3 py-1.5 text-xs text-ink/70 shadow-sm backdrop-blur-md"
              >
                {pill.icon ? (
                  <Star className="size-3 fill-brass text-brass" aria-hidden />
                ) : (
                  <span className="size-1.5 rounded-full bg-brass" />
                )}
                <span className="num font-semibold text-ink">{pill.value}</span>
                <span>{pill.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md px-0 sm:px-8 lg:mx-0 lg:max-w-none lg:px-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-brass/20 via-ledger/10 to-transparent blur-2xl"
          />
          <div className="relative pb-14 animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-both">
            <HeroInvoiceMock />

            <div className="float-y glass-card absolute -left-3 top-8 hidden w-56 rounded-2xl p-3 sm:-left-8 sm:block">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brass/15 text-brass">
                  <Wallet className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-ink/55">
                    Encaissement Wave
                  </p>
                  <p className="truncate text-sm font-semibold text-ink">
                    FAC-2026-088 payée
                  </p>
                  <p className="num text-sm font-semibold text-brass">
                    +150 000 FCFA
                  </p>
                </div>
              </div>
            </div>

            <div className="float-y-delayed glass-card absolute -right-2 top-[42%] hidden w-56 rounded-2xl p-3 sm:-right-6 sm:block">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-ledger/12 text-ledger">
                  <Bell className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-[11px] font-medium text-ink/55">
                    Relance automatique
                  </p>
                  <p className="text-sm font-semibold text-ink">
                    Rappel J-3 planifié
                  </p>
                  <p className="text-xs text-ink/55">WhatsApp · demain 9h</p>
                </div>
              </div>
            </div>

            <div className="float-y glass-card absolute -bottom-4 left-8 right-8 rounded-2xl p-3 sm:left-10 sm:right-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-ink/70">
                  Objectif trésorerie
                </p>
                <p className="num text-xs font-semibold text-brass">78%</p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-brass to-ledger" />
              </div>
              <p className="mt-1.5 text-[11px] text-ink/50">
                Encaissé ce mois · 4,2 M FCFA
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

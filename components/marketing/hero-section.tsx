import Link from "next/link";
import { ArrowRight, Bell, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { HeroInvoiceMock } from "@/components/marketing/hero-invoice-mock";
import { FREE_PLAN_SENTENCE } from "@/lib/marketing/copy";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative overflow-x-clip border-b border-line/70 bg-paper"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
          <p className="inline-flex items-center gap-2 border border-line/80 bg-paper px-3 py-1.5 text-xs font-medium text-ink/70">
            <span className="relative flex size-2">
              <span className="pulse-dot absolute inline-flex size-full rounded-full bg-brass opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-brass" />
            </span>
            Encaissement Wave et Orange Money, sans frais cachés
          </p>
          <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-[2.75rem] lg:text-5xl">
            Transformez vos devis en encaissements instantanés.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink/70 sm:text-lg">
            Devis, factures, relances WhatsApp et paiements par Wave, Orange
            Money, Moov, MTN ou carte. Tout le cycle client, sans friction.
            {` ${FREE_PLAN_SENTENCE}`}
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
                "h-11 rounded-full border-line bg-paper px-5 text-sm",
              )}
            >
              Voir le portail client
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md px-0 sm:px-8 lg:mx-0 lg:max-w-none lg:px-10">
          <div className="relative pb-6 animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-both">
            <HeroInvoiceMock />

            <div className="float-y glass-card absolute -left-1 top-6 w-[min(14rem,calc(100%-1.5rem))] rounded-sm border border-line/80 p-3 sm:-left-8 sm:top-8 sm:w-56">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-brass/25 bg-brass/12 text-brass">
                  <Wallet className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="folio-mark normal-case tracking-normal text-ink/55">
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

            <div className="float-y-delayed glass-card absolute -right-2 top-[42%] hidden w-56 rounded-sm border border-line/80 p-3 sm:-right-6 sm:block">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-ledger/25 bg-ledger/10 text-ledger">
                  <Bell className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="folio-mark normal-case tracking-normal text-ink/55">
                    Relance automatique
                  </p>
                  <p className="text-sm font-semibold text-ink">
                    Rappel J-3 planifié
                  </p>
                  <p className="text-xs text-ink/60">WhatsApp · demain 9h</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

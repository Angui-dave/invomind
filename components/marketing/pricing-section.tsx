import Link from "next/link";
import { Check } from "lucide-react";
import { SectionShell } from "@/components/marketing/section-shell";
import { buttonVariants } from "@/components/ui/button";
import { PRICING_PLANS } from "@/lib/data/settings";
import { FREE_LIMIT_LABEL } from "@/lib/marketing/copy";
import { cn } from "@/lib/utils";

const CTA_LABEL: Record<string, string> = {
  free: "Créer mon compte",
  pro: "Passer au plan Pro",
  business: "Passer au plan Business",
};

export function PricingSection() {
  return (
    <SectionShell
      id="tarifs"
      eyebrow="Formules et tarifs"
      title="Commencez gratuitement, passez en Pro quand le volume l’exige"
      description={`${FREE_LIMIT_LABEL}. Relances automatiques et Mobile Money dès le plan Pro.`}
    >
      <div className="grid gap-5 pt-2 md:grid-cols-3">
        {PRICING_PLANS.map((plan) => (
          <article
            key={plan.id}
            className={cn(
              "relative flex flex-col border bg-paper p-6",
              plan.highlighted
                ? "border-ledger/40 ring-1 ring-ledger/20"
                : "border-line/80",
            )}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ledger px-3 py-1 text-[11px] font-semibold tracking-wide text-paper">
                Paiement Mobile Money inclus
              </span>
            )}
            <h3 className="font-serif text-xl font-semibold text-ink">
              {plan.name}
            </h3>
            <p className="mt-1 text-sm text-ink/60">{plan.description}</p>

            <p className="mt-5 flex items-baseline gap-1">
              <span className="num text-3xl font-semibold text-ink">
                {plan.priceLabel}
              </span>
              {plan.price > 0 && (
                <span className="text-sm text-ink/55">/ mois</span>
              )}
            </p>

            {plan.limitLabel && (
              <p className="mt-3 text-sm text-ink/70">
                Inclus :{" "}
                <span className="num font-medium">{plan.limitLabel}</span>
              </p>
            )}

            <ul className="mt-5 flex-1 space-y-2.5 border-t border-line/80 pt-5">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-ink/80"
                >
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-brass"
                    aria-hidden
                  />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 w-full justify-center rounded-full text-sm",
                  plan.highlighted
                    ? "glow-cta bg-ledger text-paper hover:bg-ledger/90"
                    : "border border-line bg-paper text-ink hover:bg-muted",
                )}
              >
                {CTA_LABEL[plan.id] ?? "Créer mon compte"}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  Building2,
  Check,
  CreditCard,
  Loader2,
  Receipt,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  cancelSubscription,
  changePlan,
  createCheckoutSession,
} from "@/lib/actions/billing";
import {
  type BillingHistoryItem,
  type PlanId,
  type PricingPlan,
} from "@/lib/data/settings";
import { formatDateFr } from "@/lib/formatters";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type BillingPlansProps = {
  currentPlan: PricingPlan;
  plans: PricingPlan[];
  billingHistory: BillingHistoryItem[];
};

const PLAN_ICON: Record<PlanId, typeof Sparkles> = {
  free: Sparkles,
  pro: Zap,
  business: Building2,
};

export function BillingPlans({
  currentPlan,
  plans,
  billingHistory,
}: BillingPlansProps) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const busy = pending !== null;

  async function handleChangePlan(planId: PlanId, name: string) {
    setPending(planId);
    const result = await changePlan(planId);
    setPending(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? `Plan ${name}`);
    router.refresh();
  }

  async function handleCancel() {
    setPending("cancel");
    const result = await cancelSubscription();
    setPending(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Abonnement annulé");
    router.refresh();
  }

  async function handleStripe() {
    setPending("stripe");
    const result = await createCheckoutSession();
    setPending(null);
    if (result.ok && result.url) {
      window.location.href = result.url;
      return;
    }
    if (result.ok) {
      toast.success(result.message ?? "OK");
      return;
    }
    toast.error(result.error);
  }

  return (
    <div className="space-y-10 pb-8">
      <header className="dashboard-hero-bg relative overflow-hidden rounded-2xl border border-line/80 bg-card/85 p-5 shadow-sm backdrop-blur-md sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-brass/25 bg-brass/10 px-3 py-1 text-xs font-medium text-brass">
              <span className="relative flex size-2">
                <span className="pulse-dot absolute inline-flex size-full rounded-full bg-brass opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-brass" />
              </span>
              Formules &amp; tarifs
            </p>
            <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-ink">
              Abonnements
            </h1>
            <p className="mt-1.5 max-w-lg text-sm text-ink/65">
              Débloquez Conversations, l’import CSV et les relances
              automatiques. Changez de formule à tout moment.
            </p>
            <div className="mt-5">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={handleStripe}
                className="h-9 rounded-full border-line bg-paper/70"
              >
                {pending === "stripe" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <CreditCard className="size-4" aria-hidden />
                )}
                Gérer via Stripe
              </Button>
            </div>
          </div>

          <div className="glass-card w-full max-w-sm shrink-0 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-ink/50">
                  Plan actuel
                </p>
                <p className="mt-1 font-serif text-xl font-semibold text-ink">
                  {currentPlan.name}
                </p>
              </div>
              <Badge className="border-ledger/30 bg-ledger/15 text-ledger">
                Actuel
              </Badge>
            </div>
            <p className="mt-3 flex items-baseline gap-1">
              <span className="num text-2xl font-semibold text-ink">
                {currentPlan.priceLabel}
              </span>
              {currentPlan.price > 0 ? (
                <span className="text-sm text-ink/55">/ mois</span>
              ) : (
                <span className="text-sm text-ink/55">pour toujours</span>
              )}
            </p>
            <p className="mt-2 text-sm text-ink/60">{currentPlan.description}</p>
          </div>
        </div>
      </header>

      <section>
        <p className="mb-4 text-[10px] font-medium uppercase tracking-wider text-ink/40">
          Comparer les formules
        </p>
        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan.id;
            const Icon = PLAN_ICON[plan.id];
            const isUpgradePending = pending === plan.id;
            const featured = plan.highlighted && !isCurrent;

            return (
              <article
                key={plan.id}
                className={cn(
                  "glow-card-hover relative flex flex-col rounded-3xl border bg-paper p-6",
                  isCurrent
                    ?                       "border-ledger/35 shadow-xl shadow-ledger/10 ring-1 ring-ledger/20"
                    : featured
                      ? "border-ledger/30 shadow-lg shadow-ledger/10"
                      : "border-line/80 shadow-sm",
                )}
              >
                {isCurrent ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ledger px-3 py-1 text-[11px] font-semibold tracking-wide text-paper shadow-md">
                    Actuel
                  </span>
                ) : featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-ledger to-brass px-3 py-1 text-[11px] font-semibold tracking-wide text-paper shadow-md">
                    Populaire
                  </span>
                ) : null}

                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      isCurrent || featured
                        ? "bg-gradient-to-br from-brass/20 to-ledger/20 text-ledger"
                        : "bg-muted text-ink/60",
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-serif text-xl font-semibold text-ink">
                      {plan.name}
                    </h2>
                    <p className="truncate text-sm text-ink/55">
                      {plan.description}
                    </p>
                  </div>
                </div>

                <p className="mt-5 flex items-baseline gap-1">
                  <span className="num text-3xl font-semibold tracking-tight text-ink">
                    {plan.priceLabel}
                  </span>
                  {plan.price > 0 ? (
                    <span className="text-sm text-ink/55">/ mois</span>
                  ) : null}
                </p>

                {plan.limitLabel ? (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-brick/15 bg-brick/10 px-2.5 py-1 text-xs text-ink/75">
                    <Ban className="size-3.5 shrink-0 text-brick" aria-hidden />
                    <span>
                      Limite :{" "}
                      <span className="num font-medium">{plan.limitLabel}</span>
                    </span>
                  </p>
                ) : (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-brass/20 bg-brass/10 px-2.5 py-1 text-xs text-brass">
                    <Check className="size-3.5 shrink-0" aria-hidden />
                    Sans plafond mensuel
                  </p>
                )}

                <ul className="mt-5 flex-1 space-y-2.5 border-t border-line/80 pt-5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-ink/80"
                    >
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brass/12">
                        <Check className="size-3 text-brass" aria-hidden />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-col gap-2">
                  {isCurrent ? (
                    <span
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "h-11 w-full justify-center rounded-full text-sm text-ink/70",
                      )}
                    >
                      Vous êtes ici
                    </span>
                  ) : (
                    <Button
                      type="button"
                      disabled={busy}
                      className={cn(
                        "glow-cta h-11 w-full rounded-full text-sm text-paper",
                        featured
                          ? "bg-ledger hover:bg-ledger/90"
                          : "bg-navy hover:bg-navy/90",
                      )}
                      onClick={() => handleChangePlan(plan.id, plan.name)}
                    >
                      {isUpgradePending ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : null}
                      Passer au {plan.name}
                      {plan.price > 0 ? ` · ${plan.priceLabel}` : ""}
                    </Button>
                  )}
                  {isCurrent && plan.id !== "free" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 w-full rounded-full text-ink/60 hover:text-ink"
                      disabled={busy}
                      onClick={handleCancel}
                    >
                      {pending === "cancel" ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : null}
                      Annuler et revenir au Gratuit
                    </Button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-ink/40">
              Facturation
            </p>
            <h2 className="mt-1 font-serif text-lg font-semibold text-ink">
              Historique
            </h2>
          </div>
        </div>

        {billingHistory.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-paper/80 px-6 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full border border-ledger/20 bg-ledger/10">
              <Receipt className="size-5 text-ledger" aria-hidden />
            </div>
            <p className="mt-3 font-medium text-ink">Aucune facture encore</p>
            <p className="mt-1 max-w-sm text-sm text-ink/60">
              Les reçus d’abonnement apparaîtront ici après un passage au plan
              Pro ou Business.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="num text-ink/70">
                      {formatDateFr(item.date)}
                    </TableCell>
                    <TableCell className="font-medium text-ink">
                      {item.description}
                    </TableCell>
                    <TableCell className="num text-right font-medium">
                      {formatMoney(item.amount, item.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-ledger/40 bg-ledger/10 text-ledger",
                          item.status !== "paid" &&
                            "border-amber/40 bg-amber/10 text-amber",
                        )}
                      >
                        {item.status === "paid" ? "Payée" : "Ouverte"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}

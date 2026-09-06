import { PRICING_PLANS } from "@/lib/data/settings";

export const FREE_PLAN = PRICING_PLANS.find((plan) => plan.id === "free")!;
export const PRO_PLAN = PRICING_PLANS.find((plan) => plan.id === "pro")!;

export const FREE_LIMIT_LABEL = FREE_PLAN.limitLabel ?? "10 factures par mois";

export const FREE_PLAN_SENTENCE = `${FREE_LIMIT_LABEL}, sans carte bancaire.`;

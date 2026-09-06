export const HERO_STATUS_CYCLE = ["sent", "partially_paid", "paid"] as const;

export type HeroInvoiceStatus = (typeof HERO_STATUS_CYCLE)[number];

export const HERO_STATUS_LABELS: Record<HeroInvoiceStatus, string> = {
  sent: "Envoyée",
  partially_paid: "Acompte",
  paid: "Payée",
};

export function nextHeroStep(current: number): number {
  return (current + 1) % HERO_STATUS_CYCLE.length;
}

export function paidRatioForStep(step: number): number {
  if (step <= 0) return 0;
  if (step === 1) return 0.4;
  return 1;
}

export function stubCopyForStep(step: number): {
  method: string;
  action: string;
  isPaid: boolean;
} {
  const status = HERO_STATUS_CYCLE[step] ?? HERO_STATUS_CYCLE[0];

  if (status === "paid") {
    return {
      method: "Encaissement Wave",
      action: "Paiement reçu",
      isPaid: true,
    };
  }

  if (status === "partially_paid") {
    return {
      method: "Acompte reçu",
      action: "Acompte reçu — soldé le reste",
      isPaid: false,
    };
  }

  return {
    method: "Wave · Orange Money · Carte",
    action: "Payer maintenant",
    isPaid: false,
  };
}

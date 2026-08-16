import "server-only";
import { tenantStoreById } from "@/lib/mock/store";
import { planById } from "@/lib/mock/central";
import type { PlanId } from "@/lib/data/settings";
import { monthKey, todayIso } from "@/lib/date";

export type Entitlements = {
  planId: PlanId;
  maxInvoicesPerMonth: number | null;
  maxClients: number | null;
  autoReminders: boolean;
  onlinePayments: boolean;
  pipeline: boolean;
  conversations: boolean;
  reports: boolean;
  expenses: boolean;
  catalog: boolean;
  importTool: boolean;
  invoicesThisMonth: number;
  clientCount: number;
  canCreateInvoice: boolean;
  canCreateClient: boolean;
};

export async function getEntitlements(
  organizationId: string,
  planId: PlanId,
): Promise<Entitlements> {
  const store = tenantStoreById(organizationId);
  const plan = planById(planId);
  const key = monthKey(todayIso());
  const invoicesThisMonth = store.documents.filter(
    (d) => d.kind === "invoice" && monthKey(d.issueDate) === key,
  ).length;
  const clientCount = store.clients.length;

  return {
    planId,
    maxInvoicesPerMonth: plan.maxInvoicesPerMonth,
    maxClients: plan.maxClients,
    autoReminders: plan.autoReminders,
    onlinePayments: plan.onlinePayments,
    pipeline: plan.pipeline,
    conversations: plan.conversations,
    reports: plan.reports,
    expenses: plan.expenses,
    catalog: plan.catalog,
    importTool: plan.importTool,
    invoicesThisMonth,
    clientCount,
    canCreateInvoice:
      plan.maxInvoicesPerMonth === null ||
      invoicesThisMonth < plan.maxInvoicesPerMonth,
    canCreateClient:
      plan.maxClients === null || clientCount < plan.maxClients,
  };
}

export async function assertCanCreateInvoice(
  organizationId: string,
  planId: PlanId,
): Promise<void> {
  const e = await getEntitlements(organizationId, planId);
  if (!e.canCreateInvoice) {
    throw new Error(
      `Limite du plan atteinte (${e.maxInvoicesPerMonth} factures/mois). Passez à un plan supérieur.`,
    );
  }
}

export async function assertCanCreateClient(
  organizationId: string,
  planId: PlanId,
): Promise<void> {
  const e = await getEntitlements(organizationId, planId);
  if (!e.canCreateClient) {
    throw new Error(
      `Limite du plan atteinte (${e.maxClients} clients). Passez à un plan supérieur.`,
    );
  }
}

export async function assertFeature(
  organizationId: string,
  planId: PlanId,
  feature: keyof Pick<
    Entitlements,
    | "pipeline"
    | "conversations"
    | "autoReminders"
    | "onlinePayments"
    | "importTool"
  >,
): Promise<void> {
  const e = await getEntitlements(organizationId, planId);
  if (!e[feature]) {
    throw new Error(
      "Fonctionnalité réservée à un plan supérieur. Mettez à niveau votre abonnement.",
    );
  }
}

export const DEFAULT_EMAIL_TEMPLATES = [
  {
    milestone: "J-3" as const,
    label: "Rappel avant échéance",
    subject: "Rappel : facture {{montant}} due bientôt",
    body: "Bonjour {{client}},\n\nVotre facture de {{montant}} arrive à échéance dans trois jours.\nVous pouvez la consulter et la régler ici : {{lien_paiement}}\n\nCordialement",
  },
  {
    milestone: "J+3" as const,
    label: "Première relance",
    subject: "Relance : facture {{montant}}",
    body: "Bonjour {{client}},\n\nNous n’avons pas encore reçu le paiement de {{montant}}.\nRéglez en ligne via {{lien_paiement}}.\n\nCordialement",
  },
  {
    milestone: "J+7" as const,
    label: "Deuxième relance",
    subject: "Deuxième relance — {{montant}}",
    body: "Bonjour {{client}},\n\nLa facture de {{montant}} reste en attente. Lien de paiement : {{lien_paiement}}\n\nCordialement",
  },
  {
    milestone: "J+14" as const,
    label: "Dernière relance",
    subject: "Dernière relance — {{montant}}",
    body: "Bonjour {{client}},\n\nDernier rappel concernant {{montant}}. Paiement : {{lien_paiement}}\n\nCordialement",
  },
];

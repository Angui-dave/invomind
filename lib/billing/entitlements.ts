import "server-only";
import { cache } from "react";
import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { laravelRequest } from "@/lib/laravel/client";
import { tenantStoreById } from "@/lib/mock/store";
import { planById } from "@/lib/mock/central";
import type { PlanId } from "@/lib/data/settings";
import { monthKey, todayIso } from "@/lib/date";

export type Entitlements = {
  planId: PlanId;
  maxInvoicesPerMonth: number | null;
  maxClients: number | null;
  maxAgents: number | null;
  agentsUsed: number;
  canInviteAgent: boolean;
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

type ApiEntitlementsResponse = {
  plan_id?: PlanId;
  can_create_invoice?: boolean;
  invoices_used?: number;
  invoices_limit?: number | null;
  can_create_client?: boolean;
  clients_used?: number;
  clients_limit?: number | null;
  max_agents?: number | null;
  agents_used?: number;
  can_invite_agent?: boolean;
  auto_reminders?: boolean;
  online_payments?: boolean;
  pipeline?: boolean;
  conversations?: boolean;
  reports?: boolean;
  expenses?: boolean;
  catalog?: boolean;
  import_tool?: boolean;
};

function mapApiEntitlements(row: ApiEntitlementsResponse): Entitlements {
  return {
    planId: (row.plan_id ?? "free") as PlanId,
    maxInvoicesPerMonth: row.invoices_limit ?? null,
    maxClients: row.clients_limit ?? null,
    maxAgents: row.max_agents ?? null,
    agentsUsed: Number(row.agents_used ?? 0),
    canInviteAgent: Boolean(row.can_invite_agent),
    autoReminders: Boolean(row.auto_reminders),
    onlinePayments: Boolean(row.online_payments),
    pipeline: Boolean(row.pipeline),
    conversations: Boolean(row.conversations),
    reports: Boolean(row.reports),
    expenses: Boolean(row.expenses),
    catalog: Boolean(row.catalog),
    importTool: Boolean(row.import_tool),
    invoicesThisMonth: Number(row.invoices_used ?? 0),
    clientCount: Number(row.clients_used ?? 0),
    canCreateInvoice: Boolean(row.can_create_invoice),
    canCreateClient: Boolean(row.can_create_client),
  };
}

const fetchLaravelEntitlements = cache(
  async (organizationId: string): Promise<Entitlements> => {
    const token = (await readSessionCookie())?.accessToken;
    const row = await laravelRequest<ApiEntitlementsResponse>(
      "/organization/entitlements",
      { token, organizationId },
    );
    return mapApiEntitlements(row);
  },
);

function mockEntitlements(
  organizationId: string,
  planId: PlanId,
): Entitlements {
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
    maxAgents: planId === "free" ? 0 : planId === "pro" ? 3 : 10,
    agentsUsed: 0,
    canInviteAgent: planId !== "free",
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

export async function getEntitlements(
  organizationId: string,
  planId: PlanId,
): Promise<Entitlements> {
  if (isLaravelApiEnabled()) {
    return fetchLaravelEntitlements(organizationId);
  }
  return mockEntitlements(organizationId, planId);
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
    | "expenses"
    | "catalog"
    | "reports"
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

/** Mock data for InvoMind UI — French freelance billing SaaS */

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export type PaymentMethod = "card" | "mobile_money" | "transfer";

export type ReminderMilestone = "J-3" | "J+3" | "J+7" | "J+14";

export type ReminderState = "sent" | "scheduled" | "disabled";

export type PipelineStage =
  | "nouveau"
  | "qualifie"
  | "devis"
  | "negociation"
  | "gagne"
  | "perdu";

export type PlanId = "free" | "pro";

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface ReminderMilestoneStatus {
  milestone: ReminderMilestone;
  state: ReminderState;
  date: string; // ISO date
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  invoiceCount: number;
  remindersEnabled: boolean;
  portalToken: string;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  lines: InvoiceLine[];
  total: number;
  onlinePaymentEnabled: boolean;
  paidOnlineAt: string | null;
  paymentMethod: PaymentMethod | null;
  remindersEnabled: boolean;
  reminders: ReminderMilestoneStatus[];
  portalToken: string;
}

export interface Prospect {
  id: string;
  name: string;
  company: string;
  estimatedValue: number;
  stage: PipelineStage;
  lastInteractionAt: string;
}

export interface RevenuePoint {
  month: string; // "2026-03"
  label: string; // "Mar"
  amount: number;
}

export interface TopClientRevenue {
  clientId: string;
  clientName: string;
  amount: number;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: PlanId;
  invoicesThisMonth: number;
}

export interface PricingPlan {
  id: PlanId;
  name: string;
  price: number;
  priceLabel: string;
  description: string;
  features: string[];
  limitLabel?: string;
  highlighted?: boolean;
}

export const CURRENT_USER: CurrentUser = {
  id: "usr_1",
  name: "Léa Moreau",
  email: "lea@atelier-moreau.fr",
  company: "Atelier Moreau",
  plan: "pro",
  invoicesThisMonth: 7,
};

export const CLIENTS: Client[] = [
  {
    id: "cli_1",
    name: "Camille Fournier",
    company: "Atelier Marceau",
    email: "camille@atelier-marceau.fr",
    invoiceCount: 4,
    remindersEnabled: true,
    portalToken: "cli-camille-fournier",
  },
  {
    id: "cli_2",
    name: "Julien Bertrand",
    company: "Studio Nordique",
    email: "julien@studio-nordique.com",
    invoiceCount: 3,
    remindersEnabled: true,
    portalToken: "cli-julien-bertrand",
  },
  {
    id: "cli_3",
    name: "Sophie Lambert",
    company: "Maison Verte",
    email: "sophie@maisonverte.fr",
    invoiceCount: 2,
    remindersEnabled: false,
    portalToken: "cli-sophie-lambert",
  },
  {
    id: "cli_4",
    name: "Thomas Renard",
    company: "Renard & Associés",
    email: "thomas@renard-associes.fr",
    invoiceCount: 5,
    remindersEnabled: true,
    portalToken: "cli-thomas-renard",
  },
  {
    id: "cli_5",
    name: "Inès Diallo",
    company: "Diallo Consulting",
    email: "ines@diallo-consulting.fr",
    invoiceCount: 1,
    remindersEnabled: true,
    portalToken: "cli-ines-diallo",
  },
];

export const INVOICES: Invoice[] = [
  {
    id: "inv_14",
    number: "FAC-2026-014",
    clientId: "cli_1",
    clientName: "Camille Fournier",
    status: "sent",
    issueDate: "2026-08-01",
    dueDate: "2026-08-31",
    lines: [
      {
        id: "l1",
        description: "Refonte site vitrine — phase design",
        quantity: 1,
        unitPrice: 2400,
      },
      {
        id: "l2",
        description: "Intégration pages clés",
        quantity: 8,
        unitPrice: 95,
      },
    ],
    total: 3160,
    onlinePaymentEnabled: true,
    paidOnlineAt: null,
    paymentMethod: null,
    remindersEnabled: true,
    reminders: [
      { milestone: "J-3", state: "scheduled", date: "2026-08-28" },
      { milestone: "J+3", state: "scheduled", date: "2026-09-03" },
      { milestone: "J+7", state: "scheduled", date: "2026-09-07" },
      { milestone: "J+14", state: "disabled", date: "2026-09-14" },
    ],
    portalToken: "FAC-2026-014",
  },
  {
    id: "inv_13",
    number: "FAC-2026-013",
    clientId: "cli_2",
    clientName: "Julien Bertrand",
    status: "paid",
    issueDate: "2026-07-10",
    dueDate: "2026-08-10",
    lines: [
      {
        id: "l1",
        description: "Identité visuelle — pack complet",
        quantity: 1,
        unitPrice: 1850,
      },
    ],
    total: 1850,
    onlinePaymentEnabled: true,
    paidOnlineAt: "2026-08-05",
    paymentMethod: "card",
    remindersEnabled: true,
    reminders: [
      { milestone: "J-3", state: "sent", date: "2026-08-07" },
      { milestone: "J+3", state: "disabled", date: "2026-08-13" },
      { milestone: "J+7", state: "disabled", date: "2026-08-17" },
      { milestone: "J+14", state: "disabled", date: "2026-08-24" },
    ],
    portalToken: "FAC-2026-013",
  },
  {
    id: "inv_12",
    number: "FAC-2026-012",
    clientId: "cli_4",
    clientName: "Thomas Renard",
    status: "overdue",
    issueDate: "2026-06-15",
    dueDate: "2026-07-15",
    lines: [
      {
        id: "l1",
        description: "Audit UX application mobile",
        quantity: 1,
        unitPrice: 1200,
      },
      {
        id: "l2",
        description: "Rapport de recommandations",
        quantity: 1,
        unitPrice: 450,
      },
    ],
    total: 1650,
    onlinePaymentEnabled: true,
    paidOnlineAt: null,
    paymentMethod: null,
    remindersEnabled: true,
    reminders: [
      { milestone: "J-3", state: "sent", date: "2026-07-12" },
      { milestone: "J+3", state: "sent", date: "2026-07-18" },
      { milestone: "J+7", state: "sent", date: "2026-07-22" },
      { milestone: "J+14", state: "sent", date: "2026-07-29" },
    ],
    portalToken: "FAC-2026-012",
  },
  {
    id: "inv_11",
    number: "FAC-2026-011",
    clientId: "cli_3",
    clientName: "Sophie Lambert",
    status: "sent",
    issueDate: "2026-08-05",
    dueDate: "2026-09-05",
    lines: [
      {
        id: "l1",
        description: "Photographie produit — 20 clichés",
        quantity: 1,
        unitPrice: 980,
      },
    ],
    total: 980,
    onlinePaymentEnabled: false,
    paidOnlineAt: null,
    paymentMethod: null,
    remindersEnabled: false,
    reminders: [
      { milestone: "J-3", state: "disabled", date: "2026-09-02" },
      { milestone: "J+3", state: "disabled", date: "2026-09-08" },
      { milestone: "J+7", state: "disabled", date: "2026-09-12" },
      { milestone: "J+14", state: "disabled", date: "2026-09-19" },
    ],
    portalToken: "FAC-2026-011",
  },
  {
    id: "inv_10",
    number: "FAC-2026-010",
    clientId: "cli_5",
    clientName: "Inès Diallo",
    status: "draft",
    issueDate: "2026-08-12",
    dueDate: "2026-09-12",
    lines: [
      {
        id: "l1",
        description: "Accompagnement stratégique Q3",
        quantity: 12,
        unitPrice: 150,
      },
    ],
    total: 1800,
    onlinePaymentEnabled: true,
    paidOnlineAt: null,
    paymentMethod: null,
    remindersEnabled: true,
    reminders: [
      { milestone: "J-3", state: "scheduled", date: "2026-09-09" },
      { milestone: "J+3", state: "scheduled", date: "2026-09-15" },
      { milestone: "J+7", state: "scheduled", date: "2026-09-19" },
      { milestone: "J+14", state: "scheduled", date: "2026-09-26" },
    ],
    portalToken: "FAC-2026-010",
  },
  {
    id: "inv_09",
    number: "FAC-2026-009",
    clientId: "cli_1",
    clientName: "Camille Fournier",
    status: "paid",
    issueDate: "2026-05-20",
    dueDate: "2026-06-20",
    lines: [
      {
        id: "l1",
        description: "Maintenance mensuelle — mai",
        quantity: 1,
        unitPrice: 420,
      },
    ],
    total: 420,
    onlinePaymentEnabled: true,
    paidOnlineAt: "2026-06-18",
    paymentMethod: "mobile_money",
    remindersEnabled: true,
    reminders: [
      { milestone: "J-3", state: "sent", date: "2026-06-17" },
      { milestone: "J+3", state: "disabled", date: "2026-06-23" },
      { milestone: "J+7", state: "disabled", date: "2026-06-27" },
      { milestone: "J+14", state: "disabled", date: "2026-07-04" },
    ],
    portalToken: "FAC-2026-009",
  },
];

export const PROSPECTS: Prospect[] = [
  {
    id: "prs_1",
    name: "Marie Dupont",
    company: "Boulangerie Dupont",
    estimatedValue: 800,
    stage: "nouveau",
    lastInteractionAt: "2026-08-12",
  },
  {
    id: "prs_2",
    name: "Karim Benali",
    company: "Benali Tech",
    estimatedValue: 3200,
    stage: "qualifie",
    lastInteractionAt: "2026-08-10",
  },
  {
    id: "prs_3",
    name: "Élodie Martin",
    company: "Cabinet Martin",
    estimatedValue: 4500,
    stage: "devis",
    lastInteractionAt: "2026-08-08",
  },
  {
    id: "prs_4",
    name: "Nicolas Petit",
    company: "Petit Immobilier",
    estimatedValue: 2100,
    stage: "negociation",
    lastInteractionAt: "2026-08-05",
  },
  {
    id: "prs_5",
    name: "Amina Traoré",
    company: "Traoré Design",
    estimatedValue: 1500,
    stage: "gagne",
    lastInteractionAt: "2026-08-14",
  },
  {
    id: "prs_6",
    name: "Paul Girard",
    company: "Girard SA",
    estimatedValue: 6000,
    stage: "perdu",
    lastInteractionAt: "2026-07-28",
  },
];

export const REVENUE_SERIES: RevenuePoint[] = [
  { month: "2025-09", label: "Sep", amount: 4200 },
  { month: "2025-10", label: "Oct", amount: 5100 },
  { month: "2025-11", label: "Nov", amount: 3800 },
  { month: "2025-12", label: "Déc", amount: 6200 },
  { month: "2026-01", label: "Jan", amount: 4900 },
  { month: "2026-02", label: "Fév", amount: 5500 },
  { month: "2026-03", label: "Mar", amount: 7100 },
  { month: "2026-04", label: "Avr", amount: 6400 },
  { month: "2026-05", label: "Mai", amount: 7800 },
  { month: "2026-06", label: "Juin", amount: 6900 },
  { month: "2026-07", label: "Juil", amount: 8200 },
  { month: "2026-08", label: "Août", amount: 5400 },
];

export const TOP_CLIENTS: TopClientRevenue[] = [
  { clientId: "cli_4", clientName: "Thomas Renard", amount: 9200 },
  { clientId: "cli_1", clientName: "Camille Fournier", amount: 7580 },
  { clientId: "cli_2", clientName: "Julien Bertrand", amount: 5400 },
  { clientId: "cli_3", clientName: "Sophie Lambert", amount: 3100 },
  { clientId: "cli_5", clientName: "Inès Diallo", amount: 1800 },
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Gratuit",
    price: 0,
    priceLabel: "0 €",
    description: "Pour démarrer et tester le registre.",
    features: [
      "3 factures par mois",
      "Jusqu’à 5 clients",
      "Portail client",
      "Relances manuelles",
    ],
    limitLabel: "3 factures/mois",
  },
  {
    id: "pro",
    name: "Pro",
    price: 19,
    priceLabel: "19 €",
    description: "Facturation illimitée, relances et paiement en ligne.",
    features: [
      "Factures illimitées",
      "Clients illimités",
      "Relances automatiques",
      "Paiement en ligne",
      "Pipeline prospects",
      "Historique complet",
    ],
    highlighted: true,
  },
];

/** Hero mock invoice shown on the landing page */
export const HERO_INVOICE: Invoice = INVOICES[0];

export const PIPELINE_STAGES: {
  id: Exclude<PipelineStage, "perdu">;
  label: string;
}[] = [
  { id: "nouveau", label: "Nouveau contact" },
  { id: "qualifie", label: "Qualifié" },
  { id: "devis", label: "Devis envoyé" },
  { id: "negociation", label: "En négociation" },
  { id: "gagne", label: "Gagné" },
];

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  overdue: "En retard",
};

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateFr(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function portalUrl(token: string): string {
  return `https://invomind.fr/f/${token}`;
}

export function activeProspectsValue(): {
  total: number;
  count: number;
} {
  const active = PROSPECTS.filter((p) => p.stage !== "perdu");
  return {
    total: active.reduce((sum, p) => sum + p.estimatedValue, 0),
    count: active.length,
  };
}

export interface BillingHistoryItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: "paid" | "open";
}

export interface EmailTemplate {
  id: string;
  milestone: ReminderMilestone;
  label: string;
  subject: string;
  body: string;
}

export interface PaymentProviderState {
  connected: boolean;
  provider: "stripe";
  acceptedMethods: PaymentMethod[];
  feeNote: string;
}

export const BILLING_HISTORY: BillingHistoryItem[] = [
  {
    id: "bill_1",
    date: "2026-08-01",
    description: "Abonnement Pro — août 2026",
    amount: 19,
    status: "paid",
  },
  {
    id: "bill_2",
    date: "2026-07-01",
    description: "Abonnement Pro — juillet 2026",
    amount: 19,
    status: "paid",
  },
  {
    id: "bill_3",
    date: "2026-06-01",
    description: "Abonnement Pro — juin 2026",
    amount: 19,
    status: "paid",
  },
];

export const REMINDER_DEFAULTS: ReminderMilestone[] = [
  "J-3",
  "J+3",
  "J+7",
  "J+14",
];

export const REMINDER_MILESTONE_LABELS: Record<ReminderMilestone, string> = {
  "J-3": "J-3 avant échéance",
  "J+3": "J+3 après échéance",
  "J+7": "J+7 après échéance",
  "J+14": "J+14 après échéance",
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "tpl_j-3",
    milestone: "J-3",
    label: "Rappel avant échéance",
    subject: "Rappel : facture {{montant}} due bientôt",
    body: "Bonjour {{client}},\n\nVotre facture de {{montant}} arrive à échéance dans trois jours.\nVous pouvez la consulter et la régler ici : {{lien_paiement}}\n\nCordialement",
  },
  {
    id: "tpl_j+3",
    milestone: "J+3",
    label: "Première relance",
    subject: "Relance : facture {{montant}}",
    body: "Bonjour {{client}},\n\nNous n’avons pas encore reçu le paiement de {{montant}}.\nRéglez en ligne via {{lien_paiement}}.\n\nCordialement",
  },
  {
    id: "tpl_j+7",
    milestone: "J+7",
    label: "Deuxième relance",
    subject: "Deuxième relance — {{montant}}",
    body: "Bonjour {{client}},\n\nLa facture de {{montant}} reste en attente. Lien de paiement : {{lien_paiement}}\n\nCordialement",
  },
  {
    id: "tpl_j+14",
    milestone: "J+14",
    label: "Dernière relance",
    subject: "Dernière relance — {{montant}}",
    body: "Bonjour {{client}},\n\nDernier rappel concernant {{montant}}. Paiement : {{lien_paiement}}\n\nCordialement",
  },
];

export const PAYMENT_PROVIDER: PaymentProviderState = {
  connected: true,
  provider: "stripe",
  acceptedMethods: ["card", "mobile_money"],
  feeNote:
    "Frais de transaction : 1,5 % + 0,25 € par paiement carte ; 1,8 % pour Mobile Money. Déduits du montant encaissé.",
};

export const TEMPLATE_VARIABLES = [
  "{{client}}",
  "{{montant}}",
  "{{lien_paiement}}",
] as const;

export function invoiceStatusCounts(): Record<InvoiceStatus, number> {
  return INVOICES.reduce(
    (acc, inv) => {
      acc[inv.status] += 1;
      return acc;
    },
    { draft: 0, sent: 0, paid: 0, overdue: 0 } as Record<InvoiceStatus, number>,
  );
}

export function revenueSeries(months: 3 | 6 | 12): RevenuePoint[] {
  return REVENUE_SERIES.slice(-months);
}

export function getInvoiceById(id: string): Invoice | undefined {
  return INVOICES.find((inv) => inv.id === id);
}

export function getInvoiceByToken(token: string): Invoice | undefined {
  return INVOICES.find((inv) => inv.portalToken === token);
}

export function monthRevenue(): number {
  const current = REVENUE_SERIES[REVENUE_SERIES.length - 1];
  return current?.amount ?? 0;
}

export function pendingInvoiceCount(): number {
  return INVOICES.filter((inv) => inv.status === "sent").length;
}

export function overdueInvoiceCount(): number {
  return INVOICES.filter((inv) => inv.status === "overdue").length;
}

export function clientInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function relativeDateFr(iso: string, now = new Date("2026-08-15")): string {
  const target = new Date(iso);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  if (Math.abs(diffDays) < 1) return rtf.format(0, "day");
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, "day");
  const diffMonths = Math.round(diffDays / 30);
  return rtf.format(diffMonths, "month");
}

export const PIPELINE_STAGE_COLORS: Record<PipelineStage, string> = {
  nouveau: "#C9CCC3",
  qualifie: "#B08D57",
  devis: "#2F6E5B",
  negociation: "#16213E",
  gagne: "#2F6E5B",
  perdu: "#B23A48",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: "Carte bancaire",
  mobile_money: "Mobile Money",
  transfer: "Virement",
};

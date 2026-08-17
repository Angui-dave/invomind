import type { CurrencyCode } from "@/lib/money";
import type { PaymentMethod } from "@/lib/documents";
import type { TaxMode } from "@/lib/tax";

export type PlanId = "free" | "pro" | "business";

export type PipelineStage =
  | "nouveau"
  | "qualifie"
  | "devis"
  | "negociation"
  | "gagne"
  | "perdu";

export interface OrgSettings {
  companyName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  taxId: string;
  defaultCurrency: CurrencyCode;
  defaultTaxMode: TaxMode;
  defaultTaxRate: number;
  bankName: string;
  iban: string;
  bic: string;
  /** Swiss QR-IBAN when country === CH */
  qrIban?: string;
  twintNumber?: string;
  mobileMoneyProvider?: "orange_money" | "wave" | "mtn" | "moov" | "mpesa";
  mobileMoneyNumber?: string;
  legalMentions: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: PlanId;
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

export interface Prospect {
  id: string;
  name: string;
  company: string;
  estimatedValue: number;
  stage: PipelineStage;
  lastInteractionAt: string;
}

export interface BillingHistoryItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  status: "paid" | "open";
}

export interface EmailTemplate {
  id: string;
  milestone: "J-3" | "J+3" | "J+7" | "J+14";
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

export type DocumentTemplateId = "classic" | "modern" | "minimal";

export type OrgBranding = {
  displayName: string | null;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  documentTemplate: DocumentTemplateId;
  locale: string;
  currency: CurrencyCode;
};

export type OrgSettingsExtras = {
  remindersEnabled: boolean;
  reminderCadence: import("@/lib/documents").ReminderMilestone[];
  payment: PaymentProviderState;
};

export type EnabledModules = {
  pipeline: boolean;
  conversations: boolean;
  expenses: boolean;
  catalog: boolean;
  reports: boolean;
  importTool: boolean;
};

/** Empty defaults when org settings are missing */
export const DEFAULT_ORG_SETTINGS: OrgSettings = {
  companyName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
  country: "SN",
  taxId: "",
  defaultCurrency: "XOF",
  defaultTaxMode: "exclusive",
  defaultTaxRate: 18,
  bankName: "",
  iban: "",
  bic: "",
  legalMentions: "",
};

export const ORG_SETTINGS: OrgSettings = {
  companyName: "Atelier Diallo",
  email: "contact@atelier-diallo.sn",
  phone: "+221 77 000 11 22",
  address: "Rue 10, Sacré-Cœur 3",
  city: "Dakar",
  postalCode: "BP 15000",
  country: "SN",
  taxId: "SN998877665",
  defaultCurrency: "XOF",
  defaultTaxMode: "exclusive",
  defaultTaxRate: 18,
  bankName: "CBAO Groupe Attijariwafa Bank",
  iban: "SN08 SN01 0012 3456 7890 1234 5678",
  bic: "CBAOSNDA",
  mobileMoneyProvider: "wave",
  mobileMoneyNumber: "+221 77 000 11 22",
  legalMentions:
    "SARL au capital de 1 000 000 F CFA — NINEA SN998877665 — RCCM SN-DKR-2020-B-1234",
};

export const CURRENT_USER: CurrentUser = {
  id: "usr_1",
  name: "Léa Diallo",
  email: "lea@atelier-diallo.sn",
  company: "Atelier Diallo",
  plan: "pro",
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Gratuit",
    price: 0,
    priceLabel: "0 F CFA",
    description: "Pour démarrer et tester le registre.",
    features: [
      "3 factures par mois",
      "Jusqu’à 5 clients",
      "Portail client",
      "Relances manuelles",
      "Rapports TVA",
    ],
    limitLabel: "3 factures/mois",
  },
  {
    id: "pro",
    name: "Pro",
    price: 12_000,
    priceLabel: "12 000 F CFA",
    description: "Facturation illimitée, relances et paiement en ligne.",
    features: [
      "Factures et devis illimités",
      "Clients illimités",
      "Relances automatiques",
      "Paiement Mobile Money",
      "Pipeline prospects",
      "Inbox WhatsApp / Instagram / Messenger",
      "Rapports TVA",
    ],
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    price: 29_000,
    priceLabel: "29 000 F CFA",
    description: "Pour les équipes : tout Pro + import CSV et priorités support.",
    features: [
      "Tout le plan Pro",
      "Import CSV clients / catalogue",
      "Modules personnalisables",
      "Support prioritaire",
    ],
  },
];

export const PROSPECTS: Prospect[] = [
  {
    id: "prs_1",
    name: "Marie Dupont",
    company: "Boulangerie Dupont",
    estimatedValue: 400_000,
    stage: "nouveau",
    lastInteractionAt: "2026-08-12",
  },
  {
    id: "prs_2",
    name: "Karim Benali",
    company: "Benali Tech",
    estimatedValue: 1_800_000,
    stage: "qualifie",
    lastInteractionAt: "2026-08-10",
  },
  {
    id: "prs_3",
    name: "Élodie Martin",
    company: "Cabinet Martin",
    estimatedValue: 2_500_000,
    stage: "devis",
    lastInteractionAt: "2026-08-08",
  },
  {
    id: "prs_4",
    name: "Nicolas Petit",
    company: "Petit Immobilier",
    estimatedValue: 1_100_000,
    stage: "negociation",
    lastInteractionAt: "2026-08-05",
  },
  {
    id: "prs_5",
    name: "Amina Traoré",
    company: "Traoré Design",
    estimatedValue: 750_000,
    stage: "gagne",
    lastInteractionAt: "2026-08-14",
  },
  {
    id: "prs_6",
    name: "Paul Girard",
    company: "Girard SA",
    estimatedValue: 3_000_000,
    stage: "perdu",
    lastInteractionAt: "2026-07-28",
  },
];

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

export const PIPELINE_STAGE_COLORS: Record<PipelineStage, string> = {
  nouveau: "#C9CCC3",
  qualifie: "#B08D57",
  devis: "#2F6E5B",
  negociation: "#16213E",
  gagne: "#2F6E5B",
  perdu: "#B23A48",
};

export const BILLING_HISTORY: BillingHistoryItem[] = [
  {
    id: "bill_1",
    date: "2026-08-01",
    description: "Abonnement Pro — août 2026",
    amount: 12_000,
    currency: "XOF",
    status: "paid",
  },
  {
    id: "bill_2",
    date: "2026-07-01",
    description: "Abonnement Pro — juillet 2026",
    amount: 12_000,
    currency: "XOF",
    status: "paid",
  },
  {
    id: "bill_3",
    date: "2026-06-01",
    description: "Abonnement Pro — juin 2026",
    amount: 12_000,
    currency: "XOF",
    status: "paid",
  },
];

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
  acceptedMethods: ["card", "mobile_money", "transfer"],
  feeNote:
    "Frais de transaction : variables selon le moyen (carte, Mobile Money). Déduits du montant encaissé.",
};

export const TEMPLATE_VARIABLES = [
  "{{client}}",
  "{{montant}}",
  "{{lien_paiement}}",
] as const;

export function activeProspectsValue(prospects?: Prospect[]): {
  total: number;
  count: number;
} {
  const list = prospects ?? PROSPECTS;
  const active = list.filter((p) => p.stage !== "perdu");
  return {
    total: active.reduce((sum, p) => sum + p.estimatedValue, 0),
    count: active.length,
  };
}

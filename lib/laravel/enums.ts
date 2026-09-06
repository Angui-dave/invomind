/**
 * Bidirectional maps between UI (camelCase English) and Laravel API
 * (French snake_case enums matching PostgreSQL).
 */

import type {
  DocumentStatus,
  InvoiceStatus,
  PaymentMethod,
  QuoteStatus,
} from "@/lib/documents";
import type { PipelineStage } from "@/lib/data/settings";

/** Laravel `devis_statut` */
export type ApiQuoteStatut =
  | "brouillon"
  | "envoye"
  | "accepte"
  | "refuse"
  | "expire"
  | "converti";

/** Laravel `facture_statut` */
export type ApiInvoiceStatut =
  | "brouillon"
  | "envoyee"
  | "payee"
  | "partiellement_payee"
  | "impayee"
  | "en_retard"
  | "annulee";

/** Laravel `mode_paiement_enum` */
export type ApiModePaiement =
  | "cash"
  | "virement"
  | "carte"
  | "orange_money"
  | "mtn_money"
  | "moov_money"
  | "wave"
  | "cheque"
  | "autre";

/** Laravel `client_categorie` — also used as Kanban columns */
export type ApiClientCategorie =
  | "prospect"
  | "qualifie"
  | "negociation"
  | "client"
  | "inactif";

/** Laravel `produit_type` */
export type ApiProduitType = "produit" | "service";

const QUOTE_TO_API: Record<string, ApiQuoteStatut> = {
  draft: "brouillon",
  sent: "envoye",
  accepted: "accepte",
  refused: "refuse",
  expired: "expire",
  converted: "converti",
};

const QUOTE_FROM_API: Record<ApiQuoteStatut, QuoteStatus | "converted"> = {
  brouillon: "draft",
  envoye: "sent",
  accepte: "accepted",
  refuse: "refused",
  expire: "expired",
  converti: "converted",
};

const INVOICE_TO_API: Record<string, ApiInvoiceStatut> = {
  draft: "brouillon",
  sent: "envoyee",
  unpaid: "impayee",
  partially_paid: "partiellement_payee",
  paid: "payee",
  overdue: "en_retard",
  cancelled: "annulee",
};

const INVOICE_FROM_API: Record<ApiInvoiceStatut, InvoiceStatus> = {
  brouillon: "draft",
  envoyee: "sent",
  payee: "paid",
  partiellement_payee: "partially_paid",
  impayee: "unpaid",
  en_retard: "overdue",
  annulee: "cancelled",
};

/** UI payment methods that map 1:1 or via alias to Laravel ModePaiement */
const PAYMENT_TO_API: Record<string, ApiModePaiement> = {
  card: "carte",
  transfer: "virement",
  check: "cheque",
  cash: "cash",
  orange_money: "orange_money",
  mtn_money: "mtn_money",
  moov_money: "moov_money",
  wave: "wave",
  // legacy UI aliases
  mobile_money: "wave",
  twint: "autre",
  carte: "carte",
  virement: "virement",
  cheque: "cheque",
  autre: "autre",
};

const PAYMENT_FROM_API: Record<ApiModePaiement, PaymentMethod> = {
  cash: "cash",
  virement: "transfer",
  carte: "card",
  orange_money: "orange_money",
  mtn_money: "mtn_money",
  moov_money: "moov_money",
  wave: "wave",
  cheque: "check",
  autre: "autre",
};

export function quoteStatusToApi(status: string): ApiQuoteStatut {
  return QUOTE_TO_API[status] ?? (status as ApiQuoteStatut);
}

export function quoteStatusFromApi(statut: string): QuoteStatus | "converted" {
  return (
    QUOTE_FROM_API[statut as ApiQuoteStatut] ??
    (statut as QuoteStatus | "converted")
  );
}

export function invoiceStatusToApi(status: string): ApiInvoiceStatut {
  return INVOICE_TO_API[status] ?? (status as ApiInvoiceStatut);
}

export function invoiceStatusFromApi(statut: string): InvoiceStatus {
  return INVOICE_FROM_API[statut as ApiInvoiceStatut] ?? (statut as InvoiceStatus);
}

export function documentStatusFromApi(
  statut: string,
  kind: "quote" | "invoice",
): DocumentStatus {
  if (kind === "quote") {
    const s = quoteStatusFromApi(statut);
    // UI still treats converted quotes as accepted for filters that lack "converted"
    return s === "converted" ? "converted" : s;
  }
  return invoiceStatusFromApi(statut);
}

export function paymentMethodToApi(method: string): ApiModePaiement {
  return PAYMENT_TO_API[method] ?? "autre";
}

export function paymentMethodFromApi(mode: string): PaymentMethod {
  return (
    PAYMENT_FROM_API[mode as ApiModePaiement] ??
    (mode as PaymentMethod)
  );
}

export function catalogKindToApi(kind: string): ApiProduitType {
  return kind === "product" || kind === "produit" ? "produit" : "service";
}

export function catalogKindFromApi(type: string): "product" | "service" {
  return type === "produit" || type === "product" ? "product" : "service";
}

/** PipelineStage is now identical to ApiClientCategorie */
export function categorieClientToApi(
  stage: string,
): ApiClientCategorie {
  const allowed: ApiClientCategorie[] = [
    "prospect",
    "qualifie",
    "negociation",
    "client",
    "inactif",
  ];
  if (allowed.includes(stage as ApiClientCategorie)) {
    return stage as ApiClientCategorie;
  }
  // legacy pipeline stages → nearest categorie
  const legacy: Record<string, ApiClientCategorie> = {
    nouveau: "prospect",
    devis: "negociation",
    gagne: "client",
    perdu: "inactif",
  };
  return legacy[stage] ?? "prospect";
}

export function categorieClientFromApi(
  categorie: string | null | undefined,
): PipelineStage {
  const allowed: PipelineStage[] = [
    "prospect",
    "qualifie",
    "negociation",
    "client",
    "inactif",
  ];
  if (categorie && allowed.includes(categorie as PipelineStage)) {
    return categorie as PipelineStage;
  }
  return "prospect";
}

export const API_MODE_PAIEMENT_LABELS: Record<ApiModePaiement, string> = {
  cash: "Espèces",
  virement: "Virement",
  carte: "Carte bancaire",
  orange_money: "Orange Money",
  mtn_money: "MTN Money",
  moov_money: "Moov Money",
  wave: "Wave",
  cheque: "Chèque",
  autre: "Autre",
};

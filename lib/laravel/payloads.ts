/**
 * Build Laravel API request bodies from UI form data (French snake_case).
 */

import {
  catalogKindToApi,
  categorieClientToApi,
  paymentMethodToApi,
} from "@/lib/laravel/enums";

export type LaravelLineInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountPercent?: number;
  catalogItemId?: string | number;
};

export function toLaravelLines(lines: LaravelLineInput[]) {
  return lines.map((line) => {
    const productId =
      line.catalogItemId != null ? Number(line.catalogItemId) : NaN;
    return {
      produit_id: Number.isFinite(productId) && productId > 0 ? productId : null,
      designation: line.description,
      quantite: line.quantity,
      prix_unitaire: line.unitPrice,
      taux_tva: line.taxRate,
      remise_pourcentage: line.discountPercent ?? 0,
    };
  });
}

export type LaravelClientInput = {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  currency?: string;
  notes?: string | null;
  categorieClient?: string;
  paymentTermDays?: number;
  taxId?: string;
  remindersEnabled?: boolean;
};

export function toLaravelClientBody(data: LaravelClientInput) {
  const nameCompany = (data.company || data.name).trim();
  return {
    name_company: nameCompany,
    email: data.email,
    phone: data.phone || null,
    adresse: data.address || null,
    ville: data.city || null,
    code_postal: data.postalCode || null,
    country: data.country || null,
    devise: data.currency ?? "XOF",
    notes: data.notes ?? null,
    ...(data.paymentTermDays != null
      ? { delai_paiement_jours: data.paymentTermDays }
      : {}),
    ...(data.taxId != null && data.taxId !== ""
      ? { numero_fiscal: data.taxId }
      : {}),
    ...(data.categorieClient
      ? { categorie_client: categorieClientToApi(data.categorieClient) }
      : {}),
    ...(data.remindersEnabled != null
      ? { relances_actives: data.remindersEnabled }
      : {}),
  };
}

export type LaravelCatalogInput = {
  name: string;
  description?: string;
  unitPrice: number;
  currency?: string;
  taxRate?: number;
  unit?: string;
  kind?: string;
  reference?: string | null;
  actif?: boolean;
};

export function toLaravelCatalogBody(data: LaravelCatalogInput) {
  return {
    name: data.name,
    description: data.description ?? null,
    prix_unitaire: data.unitPrice,
    devise: data.currency ?? "XOF",
    taux_tva: data.taxRate ?? 0,
    unite: data.unit ?? "unité",
    type: catalogKindToApi(data.kind ?? "service"),
    ...(data.reference != null ? { reference: data.reference } : {}),
    ...(data.actif != null ? { actif: data.actif } : {}),
  };
}

export type LaravelExpenseInput = {
  date: string;
  description: string;
  /** Montant HT (pas TTC). */
  amount: number;
  currency?: string;
  categoryId: string | number;
  supplierId?: string | number | null;
  supplierName?: string | null;
  taxRate?: number;
  notes?: string | null;
  paymentMethod?: string | null;
};

export function toLaravelExpenseBody(data: LaravelExpenseInput) {
  const categorieId = Number(data.categoryId);
  const fournisseurId =
    data.supplierId != null && data.supplierId !== ""
      ? Number(data.supplierId)
      : NaN;
  return {
    date_depense: data.date,
    libelle: data.description,
    montant_ht: data.amount,
    devise: data.currency ?? "XOF",
    categorie_id: Number.isFinite(categorieId) ? categorieId : null,
    fournisseur_id: Number.isFinite(fournisseurId) ? fournisseurId : null,
    fournisseur: data.supplierName || null,
    taux_tva: data.taxRate ?? 0,
    description: data.notes ?? null,
    ...(data.paymentMethod
      ? { mode_paiement: paymentMethodToApi(data.paymentMethod) }
      : {}),
  };
}

export type LaravelPaymentInput = {
  documentId: string | number;
  amount: number;
  method: string;
  paidAt?: string;
  reference?: string | null;
  notes?: string | null;
  currency?: string;
};

export function toLaravelPaymentBody(data: LaravelPaymentInput) {
  return {
    facture_id: Number(data.documentId),
    montant: data.amount,
    mode_paiement: paymentMethodToApi(data.method),
    date_paiement: data.paidAt ?? undefined,
    reference: data.reference ?? null,
    note: data.notes ?? null,
    ...(data.currency ? { devise: data.currency } : {}),
  };
}

export type LaravelOrgInput = {
  companyName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  defaultCurrency?: string;
  logoUrl?: string | null;
  fullName?: string | null;
  parametres?: Record<string, unknown>;
};

export function toLaravelOrganizationBody(data: LaravelOrgInput) {
  return {
    name_company: data.companyName,
    email: data.email,
    phone: data.phone || null,
    adresse: data.address || null,
    ville: data.city || null,
    code_postal: data.postalCode || null,
    pays: data.country || null,
    ...(data.defaultCurrency
      ? { devise_defaut: data.defaultCurrency }
      : {}),
    ...(data.logoUrl !== undefined ? { logo_url: data.logoUrl } : {}),
    ...(data.fullName !== undefined ? { full_name: data.fullName } : {}),
    ...(data.parametres ? { parametres: data.parametres } : {}),
  };
}

export type LaravelQuoteBody = {
  client_id: number;
  date_validite?: string | null;
  devise?: string;
  note?: string | null;
  remise_montant?: number;
  lines: ReturnType<typeof toLaravelLines>;
};

export type LaravelInvoiceBody = {
  client_id: number;
  devis_id?: number | null;
  date_echeance?: string | null;
  devise?: string;
  note?: string | null;
  remise_montant?: number;
  lines: ReturnType<typeof toLaravelLines>;
};

export function toLaravelQuoteBody(data: {
  clientId: string | number;
  dueDate?: string;
  currency?: string;
  notes?: string | null;
  remiseMontant?: number;
  lines: LaravelLineInput[];
}): LaravelQuoteBody {
  return {
    client_id: Number(data.clientId),
    date_validite: data.dueDate || null,
    devise: data.currency ?? "XOF",
    note: data.notes ?? null,
    ...(data.remiseMontant != null
      ? { remise_montant: data.remiseMontant }
      : {}),
    lines: toLaravelLines(data.lines),
  };
}

export function toLaravelInvoiceBody(data: {
  clientId: string | number;
  sourceDocumentId?: string | number | null;
  dueDate?: string;
  currency?: string;
  notes?: string | null;
  remiseMontant?: number;
  lines: LaravelLineInput[];
}): LaravelInvoiceBody {
  return {
    client_id: Number(data.clientId),
    devis_id: data.sourceDocumentId
      ? Number(data.sourceDocumentId)
      : null,
    date_echeance: data.dueDate || null,
    devise: data.currency ?? "XOF",
    note: data.notes ?? null,
    ...(data.remiseMontant != null
      ? { remise_montant: data.remiseMontant }
      : {}),
    lines: toLaravelLines(data.lines),
  };
}

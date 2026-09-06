import type { CatalogItem } from "@/lib/data/catalog";
import type { Client } from "@/lib/data/clients";
import type {
  Conversation,
  ConversationLabel,
  ConversationMessage,
  ConversationChannel,
} from "@/lib/data/conversations";
import type { Expense, ExpenseCategory } from "@/lib/data/expenses";
import type { CurrencyCode } from "@/lib/money";
import type { Payment } from "@/lib/data/payments";
import type { OrgBranding, OrgSettings, Prospect } from "@/lib/data/settings";
import type { Supplier } from "@/lib/data/suppliers";
import type { BusinessDocument, DocumentLine } from "@/lib/documents";
import type {
  DeliveryAttempt,
  DeliveryStatus,
  InboundMessage,
  MaskedWebhookConfig,
} from "@/lib/webhooks/types";
import {
  catalogKindFromApi,
  categorieClientFromApi,
  documentStatusFromApi,
  paymentMethodFromApi,
} from "@/lib/laravel/enums";

type ApiRecord = Record<string, unknown>;

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function asRecord(input: unknown): ApiRecord {
  return typeof input === "object" && input !== null ? (input as ApiRecord) : {};
}

function str(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  return fallback;
}

export function mapClient(input: unknown): Client {
  const row = asRecord(input);
  const company = str(row.name_company || row.company || row.name || "");
  const contactName = str(row.contact_name || row.name || company);
  return {
    id: str(row.id),
    name: contactName || company,
    company,
    email: str(row.email),
    phone: row.phone ? str(row.phone) : undefined,
    address: row.adresse || row.address ? str(row.adresse || row.address) : undefined,
    city: row.ville || row.city ? str(row.ville || row.city) : undefined,
    postalCode: row.code_postal || row.postal_code ? str(row.code_postal || row.postal_code) : undefined,
    country: row.country || row.pays ? str(row.country || row.pays) : undefined,
    taxId: row.numero_fiscal || row.tax_id
      ? str(row.numero_fiscal || row.tax_id)
      : undefined,
    currency: (row.devise || row.currency ? str(row.devise || row.currency) : undefined) as CurrencyCode | undefined,
    paymentTermDays:
      row.delai_paiement_jours != null || row.payment_term_days != null
        ? num(row.delai_paiement_jours ?? row.payment_term_days)
        : 30,
    remindersEnabled:
      row.relances_actives != null
        ? Boolean(row.relances_actives)
        : row.reminders_enabled == null
          ? true
          : Boolean(row.reminders_enabled),
    portalToken: str(row.uuid || row.portal_token || row.id),
    categorieClient: categorieClientFromApi(
      row.categorie_client ? str(row.categorie_client) : undefined,
    ),
    notes: row.notes ? str(row.notes) : undefined,
  };
}

export function mapDocumentLine(input: unknown): DocumentLine {
  const row = asRecord(input);
  return {
    id: str(row.id),
    description: str(row.designation || row.description || ""),
    quantity: num(row.quantite ?? row.quantity ?? 1),
    unitPrice: num(row.prix_unitaire ?? row.unit_price),
    taxRate: num(row.taux_tva ?? row.tax_rate),
    discountPercent:
      row.remise_pourcentage == null && row.discount_percent == null
        ? undefined
        : num(row.remise_pourcentage ?? row.discount_percent),
    catalogItemId: row.produit_id || row.catalog_item_id
      ? str(row.produit_id ?? row.catalog_item_id)
      : undefined,
  };
}

/**
 * Map Laravel QuoteResource / InvoiceResource (French fields) → BusinessDocument.
 */
export function mapInvoiceOrQuote(
  input: unknown,
  kind: "invoice" | "quote",
  clientName = "",
): BusinessDocument {
  const row = asRecord(input);
  const statusRaw = str(row.statut || "brouillon");
  const lines = Array.isArray(row.lines)
    ? row.lines.map((item) => mapDocumentLine(item))
    : [];

  const issueDate =
    String(row.date_creation ?? "").slice(0, 10) ||
    new Date().toISOString().slice(0, 10);
  const dueDate =
    String(row.date_echeance ?? row.date_validite ?? "").slice(0, 10) ||
    issueDate;

  const status = documentStatusFromApi(statusRaw, kind);
  const total = num(row.montant_total);
  const amountPaid =
    row.montant_paye != null ? num(row.montant_paye) : undefined;
  const balanceDue =
    row.balance_due != null
      ? num(row.balance_due)
      : amountPaid != null
        ? Math.max(0, Math.round((total - amountPaid) * 100) / 100)
        : undefined;

  const client =
    row.client && typeof row.client === "object"
      ? asRecord(row.client)
      : null;
  const resolvedClientName =
    clientName ||
    str(row.client_name || client?.name_company || "");

  return {
    id: str(row.id),
    kind,
    number: str(row.numero ?? ""),
    clientId: str(row.client_id ?? ""),
    clientName: resolvedClientName,
    status,
    currency: (str(row.devise ?? "XOF") as BusinessDocument["currency"]),
    taxMode: "exclusive",
    issueDate,
    dueDate,
    lines,
    total,
    subtotalHt: num(row.sous_total),
    taxTotal: num(row.montant_tva),
    notes: row.note ? str(row.note) : undefined,
    onlinePaymentEnabled: false,
    paidOnlineAt: null,
    paymentMethod: null,
    remindersEnabled: kind === "invoice",
    reminders: [],
    portalToken: str(row.uuid || row.id),
    sourceDocumentId: row.devis_id ? str(row.devis_id) : undefined,
    frozen: statusRaw !== "brouillon",
    pdfReady: false,
    amountPaid,
    balanceDue,
  };
}

/** Legacy English DocumentResource shape — routes to FR mapper when detected. */
export function mapDocument(input: unknown): BusinessDocument {
  const row = asRecord(input);
  if (row.statut != null || row.numero != null || row.montant_total != null) {
    const kind =
      row.devis_id != null || row.date_echeance != null || row.montant_paye != null
        ? "invoice"
        : row.date_validite != null
          ? "quote"
          : str(row.kind) === "quote"
            ? "quote"
            : "invoice";
    return mapInvoiceOrQuote(input, kind, str(row.client_name));
  }

  const lines = Array.isArray(row.lines)
    ? row.lines.map((item) => mapDocumentLine(item))
    : [];
  const reminders = Array.isArray(row.reminders)
    ? row.reminders.map((item) => {
        const r = asRecord(item);
        return {
          milestone: str(r.milestone) as BusinessDocument["reminders"][number]["milestone"],
          state: str(r.state) as BusinessDocument["reminders"][number]["state"],
          date: str(r.date) || str(r.scheduled_for).slice(0, 10),
        };
      })
    : [];
  return {
    id: str(row.id),
    kind: str(row.kind) as BusinessDocument["kind"],
    number: str(row.number),
    clientId: str(row.client_id),
    clientName: str(row.client_name),
    status: str(row.status) as BusinessDocument["status"],
    currency: str(row.currency) as BusinessDocument["currency"],
    taxMode: str(row.tax_mode) as BusinessDocument["taxMode"],
    issueDate: str(row.issue_date),
    dueDate: str(row.due_date),
    lines,
    total: num(row.total),
    subtotalHt: num(row.subtotal_ht),
    taxTotal: num(row.tax_total),
    onlinePaymentEnabled: Boolean(row.online_payment_enabled),
    paidOnlineAt: row.paid_online_at ? str(row.paid_online_at) : null,
    paymentMethod: row.payment_method
      ? paymentMethodFromApi(str(row.payment_method))
      : null,
    remindersEnabled: Boolean(row.reminders_enabled),
    reminders,
    portalToken: str(row.portal_token || row.uuid),
    sourceDocumentId: row.source_document_id ? str(row.source_document_id) : undefined,
    notes: row.notes ? str(row.notes) : undefined,
    frozen: Boolean(row.frozen),
    pdfReady: Boolean(row.pdf_ready),
  };
}

export function mapSupplier(input: unknown): Supplier {
  const row = asRecord(input);
  const company = str(row.name_company || row.company || "");
  return {
    id: str(row.id),
    name: str(row.contact || row.name || ""),
    company,
    email: str(row.email),
    phone: row.phone ? str(row.phone) : undefined,
    address: row.adresse || row.address ? str(row.adresse || row.address) : undefined,
    city: row.ville || row.city ? str(row.ville || row.city) : undefined,
    country: row.country ? str(row.country) : undefined,
    taxId: row.numero_fiscal || row.tax_id
      ? str(row.numero_fiscal || row.tax_id)
      : undefined,
    notes: row.notes ? str(row.notes) : undefined,
  };
}

export function mapExpenseCategory(input: unknown): ExpenseCategory {
  const row = asRecord(input);
  return {
    id: str(row.id),
    name: str(row.nom || row.name || ""),
    color: str(row.couleur || row.color || "#888888"),
    isGlobal: row.is_global == null ? row.orga_id == null : Boolean(row.is_global),
    actif: row.actif == null ? true : Boolean(row.actif),
  };
}

export function mapExpense(input: unknown): Expense {
  const row = asRecord(input);
  const category = asRecord(row.category);
  const supplier = asRecord(row.supplier);
  const amountHt = num(row.montant_ht ?? row.amount_ht ?? row.amount);
  const taxRate = num(row.taux_tva ?? row.tax_rate);
  const taxAmount = num(row.montant_tva ?? row.tax_amount);
  const amountTtc = num(
    row.montant_ttc ?? row.amount_ttc ?? amountHt + taxAmount,
  );
  const dateRaw = row.date_depense ?? row.date;
  const supplierId = row.fournisseur_id ?? row.supplier_id ?? supplier.id;
  const supplierName =
    supplier.name_company ||
    supplier.company ||
    row.fournisseur ||
    row.supplier_name;
  return {
    id: str(row.id),
    date: String(dateRaw ?? "").slice(0, 10),
    description: str(row.libelle || row.description || ""),
    amountHt,
    amountTtc,
    currency: str(row.devise || row.currency || "XOF") as Expense["currency"],
    categoryId: str(row.categorie_id ?? row.category_id ?? category.id),
    supplierId: supplierId ? str(supplierId) : undefined,
    supplierName: supplierName ? str(supplierName) : undefined,
    taxRate,
    taxDeductible: taxRate > 0,
    taxAmount,
    notes: row.description || row.notes ? str(row.description || row.notes) : undefined,
    statut: row.statut ? str(row.statut) : "validee",
    paymentMethod: row.mode_paiement
      ? paymentMethodFromApi(str(row.mode_paiement))
      : undefined,
  };
}

export function mapPayment(input: unknown): Payment {
  const row = asRecord(input);
  const dateRaw = row.date_paiement ?? row.paid_at;
  const methodRaw = str(row.mode_paiement || row.method || "virement");
  const invoice =
    row.invoice && typeof row.invoice === "object"
      ? asRecord(row.invoice)
      : null;
  const client =
    row.client && typeof row.client === "object"
      ? asRecord(row.client)
      : null;
  return {
    id: str(row.id),
    documentId: str(row.facture_id ?? row.document_id),
    documentNumber: str(
      row.document_number || invoice?.numero || "",
    ),
    clientId: str(row.client_id ?? client?.id ?? ""),
    clientName: str(
      row.client_name || client?.name_company || "",
    ),
    amount: num(row.montant ?? row.amount),
    currency: str(row.devise || row.currency || "XOF") as Payment["currency"],
    method: paymentMethodFromApi(methodRaw),
    paidAt: String(dateRaw ?? "").slice(0, 10),
    reference: row.reference ? str(row.reference) : undefined,
    notes: row.note || row.notes ? str(row.note || row.notes) : undefined,
  };
}

export function mapCatalogItem(input: unknown): CatalogItem {
  const row = asRecord(input);
  const type = str(row.type || row.kind || "service");
  return {
    id: str(row.id),
    name: str(row.name || ""),
    description: str(row.description || ""),
    unitPrice: num(row.prix_unitaire ?? row.unit_price),
    currency: str(row.devise || row.currency || "XOF") as CatalogItem["currency"],
    taxRate: num(row.taux_tva ?? row.tax_rate),
    unit: str(row.unite || row.unit || "unité"),
    kind: catalogKindFromApi(type),
    reference: row.reference ? str(row.reference) : undefined,
    actif: row.actif == null ? undefined : Boolean(row.actif),
  };
}

export function mapProspect(input: unknown): Prospect {
  const row = asRecord(input);
  return {
    id: str(row.id),
    name: str(row.name || row.name_company || ""),
    company: str(row.company || row.name_company || ""),
    estimatedValue: num(row.estimated_value),
    stage: categorieClientFromApi(
      row.categorie_client ? str(row.categorie_client) : str(row.stage),
    ),
    lastInteractionAt: str(row.last_interaction_at || row.updated_at || "").slice(0, 10),
  };
}

/** Derive a Kanban card from a Client (+ optional estimated value). */
export function clientToProspect(
  client: Client,
  estimatedValue = 0,
): Prospect {
  return {
    id: client.id,
    name: client.name,
    company: client.company || client.name,
    estimatedValue,
    stage: client.categorieClient ?? "prospect",
    lastInteractionAt: new Date().toISOString().slice(0, 10),
  };
}

export function mapConversation(input: unknown): Conversation {
  const row = asRecord(input);
  const contact = asRecord(row.contact ?? {});
  const contactName =
    str(contact.nom_affichage) ||
    str(row.contact_name) ||
    str(row.contactName) ||
    "Contact";
  const canal = str(row.canal || row.channel, "whatsapp") as Conversation["channel"];
  const statutRaw = str(row.statut || row.status);
  const statusMap: Record<string, Conversation["status"]> = {
    ouverte: "open",
    en_attente: "pending",
    resolue: "resolved",
    open: "open",
    pending: "pending",
    resolved: "resolved",
  };
  const labelsRaw = Array.isArray(row.labels) ? row.labels : [];
  const initials = contactName
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    id: str(row.id),
    channel: canal,
    contactName,
    contactHandle: str(contact.identifiant_externe || row.contact_handle || contactName),
    threadRef: row.thread_ref ? str(row.thread_ref) : undefined,
    inboxId: row.boite_reception_id != null ? str(row.boite_reception_id) : undefined,
    avatarInitials: row.avatar_initials
      ? str(row.avatar_initials)
      : initials || undefined,
    clientId: contact.client_id
      ? str(contact.client_id)
      : row.client_id
        ? str(row.client_id)
        : undefined,
    unreadCount: num(row.non_lus_count ?? row.unread_count),
    lastMessageAt:
      str(row.derniere_activite_at) ||
      str(row.last_message_at) ||
      new Date().toISOString(),
    archived: Boolean(row.archivee ?? row.archived),
    status: statusMap[statutRaw] ?? "open",
    agentId: row.agent_id != null ? str(row.agent_id) : undefined,
    labels: labelsRaw.map((l) => {
      const lab = asRecord(l);
      return {
        id: str(lab.id),
        name: str(lab.nom || lab.name),
        color: str(lab.couleur || lab.color, "#64748b"),
      };
    }),
  };
}

export function mapConversationMessage(input: unknown): ConversationMessage {
  const row = asRecord(input);
  const directionRaw = str(row.direction);
  const direction: ConversationMessage["direction"] =
    directionRaw === "entrant" || directionRaw === "inbound"
      ? "inbound"
      : "outbound";
  const statusRaw = str(row.statut_livraison || row.status);
  const statusMap: Record<string, NonNullable<ConversationMessage["status"]>> = {
    en_attente: "pending",
    envoye: "sent",
    livre: "delivered",
    lu: "read",
    echec: "failed",
    pending: "pending",
    sent: "sent",
    delivered: "delivered",
    read: "read",
    failed: "failed",
  };

  return {
    id: str(row.id),
    conversationId: str(row.conversation_id || row.conversationId),
    direction,
    body: str(row.contenu || row.body),
    sentAt: str(row.envoye_at || row.sent_at || row.sentAt),
    status: statusRaw ? statusMap[statusRaw] : undefined,
    contentType: str(row.type_contenu || row.contentType) || undefined,
    mediaUrl: str(row.url_media || row.mediaUrl) || undefined,
  };
}

export function mapInbox(input: unknown): {
  id: string;
  channel: Conversation["channel"];
  name: string;
  mode: string;
  connectionStatus: string;
  active: boolean;
  maskedCredentials: Record<string, unknown>;
} {
  const row = asRecord(input);
  return {
    id: str(row.id),
    channel: str(row.canal, "whatsapp") as Conversation["channel"],
    name: str(row.nom),
    mode: str(row.mode, "fake"),
    connectionStatus: str(row.statut_connexion),
    active: Boolean(row.actif),
    maskedCredentials: asRecord(row.identifiants_masques ?? {}),
  };
}

export function mapLabel(input: unknown): ConversationLabel {
  const row = asRecord(input);
  return {
    id: str(row.id),
    name: str(row.nom || row.name),
    color: str(row.couleur || row.color, "#64748b"),
  };
}

export function mapOrgSettings(input: unknown): OrgSettings {
  const row = asRecord(input);
  const taxModeRaw = str(row.default_tax_mode || row.defaultTaxMode);
  const defaultTaxMode: OrgSettings["defaultTaxMode"] =
    taxModeRaw === "inclusive" ? "inclusive" : "exclusive";
  const currencyRaw = str(row.default_currency || row.devise_defaut || "XOF", "XOF");
  return {
    companyName: str(row.company_name || row.name_company),
    email: str(row.email),
    phone: str(row.phone),
    address: str(row.address || row.adresse),
    city: str(row.city || row.ville),
    postalCode: str(row.postal_code || row.code_postal),
    country: str(row.country || row.pays, "Côte d'Ivoire"),
    taxId: str(row.tax_id),
    defaultCurrency: (currencyRaw || "XOF") as OrgSettings["defaultCurrency"],
    defaultTaxMode,
    defaultTaxRate: num(row.default_tax_rate ?? 18),
    bankName: str(row.bank_name),
    iban: str(row.iban),
    bic: str(row.bic),
    qrIban: row.qr_iban ? str(row.qr_iban) : undefined,
    twintNumber: row.twint_number ? str(row.twint_number) : undefined,
    mobileMoneyProvider: row.mobile_money_provider
      ? (str(row.mobile_money_provider) as OrgSettings["mobileMoneyProvider"])
      : undefined,
    mobileMoneyNumber: row.mobile_money_number ? str(row.mobile_money_number) : undefined,
    legalMentions: str(row.legal_mentions),
  };
}

export function mapBranding(input: unknown): OrgBranding {
  const row = asRecord(input);
  const templateRaw = str(row.document_template, "classic");
  const documentTemplate = (
    templateRaw === "modern" || templateRaw === "minimal"
      ? templateRaw
      : "classic"
  ) as OrgBranding["documentTemplate"];
  return {
    displayName: row.display_name
      ? str(row.display_name)
      : row.name_company
        ? str(row.name_company)
        : null,
    logoUrl: row.logo_url ? str(row.logo_url) : null,
    primaryColor: str(row.primary_color, "#2563eb") || "#2563eb",
    accentColor: str(row.accent_color, "#10b981") || "#10b981",
    fontFamily: str(row.font_family, "Inter") || "Inter",
    documentTemplate,
    locale: str(row.locale, "fr-SN") || "fr-SN",
    currency: (str(row.currency || row.devise_defaut, "XOF") || "XOF") as OrgBranding["currency"],
  };
}

export function mapInboundMessage(input: unknown): InboundMessage {
  const row = asRecord(input);
  const channel = str(row.channel, "whatsapp") as ConversationChannel;
  return {
    id: str(row.id),
    channel,
    handle: str(row.handle),
    contactName: row.contact_name
      ? str(row.contact_name)
      : row.contactName
        ? str(row.contactName)
        : undefined,
    body: str(row.body),
    sentAt: str(row.sent_at) || str(row.sentAt),
    threadRef: row.thread_ref
      ? str(row.thread_ref)
      : row.threadRef
        ? str(row.threadRef)
        : undefined,
  };
}

export function mapDeliveryAttempt(input: unknown): DeliveryAttempt {
  const row = asRecord(input);
  const statusRaw = str(row.status, "failed");
  const status = (
    statusRaw === "success" || statusRaw === "failed" || statusRaw === "skipped"
      ? statusRaw
      : "failed"
  ) as DeliveryStatus;
  return {
    id: str(row.id),
    conversationId: str(row.conversation_id) || str(row.conversationId),
    channel: str(row.channel, "whatsapp") as ConversationChannel,
    status,
    httpStatus:
      row.http_status != null
        ? num(row.http_status)
        : row.httpStatus != null
          ? num(row.httpStatus)
          : undefined,
    error: row.error ? str(row.error) : undefined,
    attemptedAt: str(row.attempted_at) || str(row.attemptedAt),
    durationMs: num(row.duration_ms ?? row.durationMs),
  };
}

export function mapWebhookConfigResponse(input: unknown): {
  config: MaskedWebhookConfig;
  deliveries: DeliveryAttempt[];
} {
  const root = asRecord(input);
  const cfg = asRecord(root.config);
  const url = str(cfg.url);
  const hasSecret = Boolean(cfg.has_secret ?? cfg.hasSecret);
  const deliveriesRaw = Array.isArray(root.deliveries) ? root.deliveries : [];

  return {
    config: {
      url,
      secretMasked:
        str(cfg.secret_masked) ||
        str(cfg.secretMasked) ||
        (hasSecret ? "••••••••" : ""),
      hasSecret,
      enabled: Boolean(cfg.enabled),
      metaVerifyConfigured: Boolean(
        cfg.meta_verify_configured ?? cfg.metaVerifyConfigured,
      ),
      metaAppSecretConfigured: Boolean(
        cfg.meta_app_secret_configured ?? cfg.metaAppSecretConfigured,
      ),
      tiktokSecretConfigured: Boolean(
        cfg.tiktok_secret_configured ?? cfg.tiktokSecretConfigured,
      ),
    },
    deliveries: deliveriesRaw.map(mapDeliveryAttempt),
  };
}

export function mapConversationSendStatus(input: unknown): {
  status: DeliveryStatus | string;
  error?: string;
} {
  const row = asRecord(input);
  if (typeof row.status === "string") {
    return { status: row.status, error: row.error ? str(row.error) : undefined };
  }
  const delivery = asRecord(row.delivery);
  const status = str(delivery.status, "failed");
  return {
    status,
    error: delivery.error
      ? str(delivery.error)
      : row.error
        ? str(row.error)
        : undefined,
  };
}

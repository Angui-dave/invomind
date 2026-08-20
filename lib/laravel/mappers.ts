import type { CatalogItem } from "@/lib/data/catalog";
import type { Client } from "@/lib/data/clients";
import type { Conversation, ConversationMessage } from "@/lib/data/conversations";
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
import type { ConversationChannel } from "@/lib/data/conversations";

type ApiRecord = Record<string, unknown>;

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function asRecord(input: unknown): ApiRecord {
  return typeof input === "object" && input !== null ? (input as ApiRecord) : {};
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function mapClient(input: unknown): Client {
  const row = asRecord(input);
  return {
    id: str(row.id),
    name: str(row.name),
    company: str(row.company),
    email: str(row.email),
    phone: row.phone ? str(row.phone) : undefined,
    address: row.address ? str(row.address) : undefined,
    city: row.city ? str(row.city) : undefined,
    postalCode: row.postal_code ? str(row.postal_code) : undefined,
    country: row.country ? str(row.country) : undefined,
    taxId: row.tax_id ? str(row.tax_id) : undefined,
    currency: (row.currency ? str(row.currency) : undefined) as CurrencyCode | undefined,
    paymentTermDays: row.payment_term_days ? num(row.payment_term_days) : undefined,
    remindersEnabled: Boolean(row.reminders_enabled),
    portalToken: str(row.portal_token),
  };
}

export function mapDocumentLine(input: unknown): DocumentLine {
  const row = asRecord(input);
  return {
    id: str(row.id),
    description: str(row.description),
    quantity: num(row.quantity),
    unitPrice: num(row.unit_price),
    taxRate: num(row.tax_rate),
    discountPercent: row.discount_percent == null ? undefined : num(row.discount_percent),
    catalogItemId: row.catalog_item_id ? str(row.catalog_item_id) : undefined,
  };
}

export function mapDocument(input: unknown): BusinessDocument {
  const row = asRecord(input);
  const lines = Array.isArray(row.lines) ? row.lines.map((item) => mapDocumentLine(item)) : [];
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
    paymentMethod: row.payment_method ? (str(row.payment_method) as BusinessDocument["paymentMethod"]) : null,
    remindersEnabled: Boolean(row.reminders_enabled),
    reminders,
    portalToken: str(row.portal_token),
    sourceDocumentId: row.source_document_id ? str(row.source_document_id) : undefined,
    notes: row.notes ? str(row.notes) : undefined,
    frozen: Boolean(row.frozen),
    pdfReady: Boolean(row.pdf_ready),
  };
}

export function mapSupplier(input: unknown): Supplier {
  const row = asRecord(input);
  return {
    id: str(row.id),
    name: str(row.name),
    company: str(row.company),
    email: str(row.email),
    phone: row.phone ? str(row.phone) : undefined,
    address: row.address ? str(row.address) : undefined,
    city: row.city ? str(row.city) : undefined,
    country: row.country ? str(row.country) : undefined,
    taxId: row.tax_id ? str(row.tax_id) : undefined,
    notes: row.notes ? str(row.notes) : undefined,
  };
}

export function mapExpenseCategory(input: unknown): ExpenseCategory {
  const row = asRecord(input);
  return { id: str(row.id), name: str(row.name), color: str(row.color) };
}

export function mapExpense(input: unknown): Expense {
  const row = asRecord(input);
  return {
    id: str(row.id),
    date: str(row.date),
    description: str(row.description),
    amount: num(row.amount),
    currency: str(row.currency) as Expense["currency"],
    categoryId: str(row.category_id),
    supplierId: row.supplier_id ? str(row.supplier_id) : undefined,
    supplierName: row.supplier_name ? str(row.supplier_name) : undefined,
    taxRate: num(row.tax_rate),
    taxDeductible: Boolean(row.tax_deductible),
    taxAmount: num(row.tax_amount),
    notes: row.notes ? str(row.notes) : undefined,
  };
}

export function mapPayment(input: unknown): Payment {
  const row = asRecord(input);
  return {
    id: str(row.id),
    documentId: str(row.document_id),
    documentNumber: str(row.document_number),
    clientId: str(row.client_id),
    clientName: str(row.client_name),
    amount: num(row.amount),
    currency: str(row.currency) as Payment["currency"],
    method: str(row.method) as Payment["method"],
    paidAt: str(row.paid_at),
    reference: row.reference ? str(row.reference) : undefined,
    notes: row.notes ? str(row.notes) : undefined,
  };
}

export function mapCatalogItem(input: unknown): CatalogItem {
  const row = asRecord(input);
  return {
    id: str(row.id),
    name: str(row.name),
    description: str(row.description),
    unitPrice: num(row.unit_price),
    currency: str(row.currency) as CatalogItem["currency"],
    taxRate: num(row.tax_rate),
    unit: str(row.unit),
    kind: str(row.kind) as CatalogItem["kind"],
  };
}

export function mapProspect(input: unknown): Prospect {
  const row = asRecord(input);
  return {
    id: str(row.id),
    name: str(row.name),
    company: str(row.company),
    estimatedValue: num(row.estimated_value),
    stage: str(row.stage) as Prospect["stage"],
    lastInteractionAt: str(row.last_interaction_at),
  };
}

export function mapConversation(input: unknown): Conversation {
  const row = asRecord(input);
  return {
    id: str(row.id),
    channel: str(row.channel) as Conversation["channel"],
    contactName: str(row.contact_name),
    contactHandle: str(row.contact_handle),
    threadRef: row.thread_ref ? str(row.thread_ref) : undefined,
    avatarInitials: row.avatar_initials ? str(row.avatar_initials) : undefined,
    clientId: row.client_id ? str(row.client_id) : undefined,
    prospectId: row.prospect_id ? str(row.prospect_id) : undefined,
    unreadCount: num(row.unread_count),
    lastMessageAt: str(row.last_message_at),
    archived: Boolean(row.archived),
  };
}

export function mapConversationMessage(input: unknown): ConversationMessage {
  const row = asRecord(input);
  return {
    id: str(row.id),
    conversationId: str(row.conversation_id),
    direction: str(row.direction) as ConversationMessage["direction"],
    body: str(row.body),
    sentAt: str(row.sent_at),
    status: row.status ? (str(row.status) as ConversationMessage["status"]) : undefined,
  };
}

export function mapOrgSettings(input: unknown): OrgSettings {
  const row = asRecord(input);
  return {
    companyName: str(row.company_name),
    email: str(row.email),
    phone: str(row.phone),
    address: str(row.address),
    city: str(row.city),
    postalCode: str(row.postal_code),
    country: str(row.country),
    taxId: str(row.tax_id),
    defaultCurrency: str(row.default_currency) as OrgSettings["defaultCurrency"],
    defaultTaxMode: str(row.default_tax_mode) as OrgSettings["defaultTaxMode"],
    defaultTaxRate: num(row.default_tax_rate),
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
    displayName: row.display_name ? str(row.display_name) : null,
    logoUrl: row.logo_url ? str(row.logo_url) : null,
    primaryColor: str(row.primary_color, "#2563eb") || "#2563eb",
    accentColor: str(row.accent_color, "#10b981") || "#10b981",
    fontFamily: str(row.font_family, "Inter") || "Inter",
    documentTemplate,
    locale: str(row.locale, "fr-SN") || "fr-SN",
    currency: (str(row.currency, "XOF") || "XOF") as OrgBranding["currency"],
  };
}

export function mapInboundMessage(input: unknown): InboundMessage {
  const row = asRecord(input);
  const channel = str(row.channel, "whatsapp") as ConversationChannel;
  return {
    id: str(row.id),
    channel,
    handle: str(row.handle),
    contactName: row.contact_name ? str(row.contact_name) : row.contactName ? str(row.contactName) : undefined,
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
      secretMasked: str(cfg.secret_masked) || str(cfg.secretMasked) || (hasSecret ? "••••••••" : ""),
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

/** Normalize Laravel send response `{ message, delivery }` or mock `{ status }` to a status string. */
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
    error: delivery.error ? str(delivery.error) : row.error ? str(row.error) : undefined,
  };
}


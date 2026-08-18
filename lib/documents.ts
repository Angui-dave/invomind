/** Document numbering, status transitions, quote→invoice / invoice→credit conversions */

import { addDays, todayIso } from "@/lib/date";
import { computeTotals, type TaxMode } from "@/lib/tax";
import type { CurrencyCode } from "@/lib/money";

export type DocumentKind = "quote" | "invoice" | "credit_note";

export type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "refused"
  | "expired";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export type CreditNoteStatus = "draft" | "issued" | "applied";

export type DocumentStatus = QuoteStatus | InvoiceStatus | CreditNoteStatus;

export type PaymentMethod =
  | "card"
  | "mobile_money"
  | "transfer"
  | "twint"
  | "cash"
  | "check";

export type ReminderMilestone = "J-3" | "J+3" | "J+7" | "J+14";
export type ReminderState = "sent" | "scheduled" | "disabled";

export interface DocumentLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountPercent?: number;
  catalogItemId?: string;
  unit?: string;
}

export interface ReminderMilestoneStatus {
  milestone: ReminderMilestone;
  state: ReminderState;
  date: string;
}

export interface BusinessDocument {
  id: string;
  kind: DocumentKind;
  number: string;
  clientId: string;
  clientName: string;
  status: DocumentStatus;
  currency: CurrencyCode;
  taxMode: TaxMode;
  issueDate: string;
  dueDate: string;
  lines: DocumentLine[];
  /** Cached TTC for list views — always recompute from lines when editing */
  total: number;
  subtotalHt: number;
  taxTotal: number;
  onlinePaymentEnabled: boolean;
  paidOnlineAt: string | null;
  paymentMethod: PaymentMethod | null;
  remindersEnabled: boolean;
  reminders: ReminderMilestoneStatus[];
  portalToken: string;
  sourceDocumentId?: string;
  notes?: string;
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  accepted: "Accepté",
  refused: "Refusé",
  expired: "Expiré",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  partially_paid: "Partiellement payée",
  paid: "Payée",
  overdue: "En retard",
  cancelled: "Annulée",
};

export const CREDIT_NOTE_STATUS_LABELS: Record<CreditNoteStatus, string> = {
  draft: "Brouillon",
  issued: "Émis",
  applied: "Appliqué",
};

/** Backward-compatible flat map covering invoice statuses (legacy) */
export const STATUS_LABELS: Record<string, string> = {
  ...QUOTE_STATUS_LABELS,
  ...INVOICE_STATUS_LABELS,
  ...CREDIT_NOTE_STATUS_LABELS,
};

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  quote: "Devis",
  invoice: "Facture",
  credit_note: "Avoir",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: "Carte bancaire",
  mobile_money: "Mobile Money",
  transfer: "Virement",
  twint: "TWINT",
  cash: "Espèces",
  check: "Chèque",
};

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

const PREFIX: Record<DocumentKind, string> = {
  quote: "DEV",
  invoice: "FAC",
  credit_note: "AV",
};

export function yearFromIso(iso: string, fallback = new Date().getFullYear()): number {
  const year = Number.parseInt(iso.slice(0, 4), 10);
  return Number.isFinite(year) && year >= 2000 ? year : fallback;
}

export function nextDocumentNumber(
  kind: DocumentKind,
  existing: BusinessDocument[],
  year = new Date().getFullYear(),
): string {
  const prefix = `${PREFIX[kind]}-${year}-`;
  const nums = existing
    .filter((d) => d.kind === kind && d.number.startsWith(prefix))
    .map((d) => Number.parseInt(d.number.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export function recomputeDocumentTotals(
  doc: Pick<BusinessDocument, "lines" | "taxMode">,
): Pick<BusinessDocument, "total" | "subtotalHt" | "taxTotal"> {
  const t = computeTotals(doc.lines, doc.taxMode);
  return {
    subtotalHt: t.subtotalHt,
    taxTotal: t.taxTotal,
    total: t.totalTtc,
  };
}

export function convertQuoteToInvoice(
  quote: BusinessDocument,
  existing: BusinessDocument[],
  paymentTermDays = 30,
): BusinessDocument {
  if (quote.kind !== "quote") {
    throw new Error("Seul un devis peut être converti en facture");
  }
  const number = nextDocumentNumber("invoice", existing);
  const issueDate = todayIso();
  return {
    ...quote,
    id: `inv_${Math.random().toString(36).slice(2, 8)}`,
    kind: "invoice",
    number,
    status: "draft",
    sourceDocumentId: quote.id,
    portalToken: opaquePortalToken(),
    paidOnlineAt: null,
    paymentMethod: null,
    issueDate,
    dueDate: addDays(issueDate, paymentTermDays),
  };
}

export function createCreditNoteFromInvoice(
  invoice: BusinessDocument,
  existing: BusinessDocument[],
): BusinessDocument {
  if (invoice.kind !== "invoice") {
    throw new Error("Seul une facture peut générer un avoir");
  }
  const number = nextDocumentNumber("credit_note", existing);
  const issueDate = todayIso();
  return {
    ...invoice,
    id: `cn_${Math.random().toString(36).slice(2, 8)}`,
    kind: "credit_note",
    number,
    status: "draft",
    sourceDocumentId: invoice.id,
    portalToken: opaquePortalToken(),
    onlinePaymentEnabled: false,
    paidOnlineAt: null,
    paymentMethod: null,
    remindersEnabled: false,
    reminders: [],
    issueDate,
    dueDate: issueDate,
  };
}

export function opaquePortalToken(): string {
  return `pt_${Math.random().toString(36).slice(2, 12)}`;
}

export function emptyLine(taxRate = 18): DocumentLine {
  return {
    id: `line_${Math.random().toString(36).slice(2, 8)}`,
    description: "",
    quantity: 1,
    unitPrice: 0,
    taxRate,
    unit: "unité",
  };
}

import {
  INVOICE_STATUS_LABELS,
  QUOTE_STATUS_LABELS,
  type InvoiceStatus,
  type QuoteStatus,
} from "@/lib/documents";

export const INVOICE_AWAITING_FILTER = "awaiting" as const;

export type InvoiceStatusFilter = "all" | typeof INVOICE_AWAITING_FILTER | InvoiceStatus;
export type QuoteStatusFilter = "all" | QuoteStatus;
export type ClientsTab = "clients" | "prospects";

export type FilterChipOption = {
  value: string;
  label: string;
};

const INVOICE_STATUSES: InvoiceStatus[] = [
  "draft",
  "sent",
  "unpaid",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
];

const QUOTE_STATUSES: QuoteStatus[] = [
  "draft",
  "sent",
  "accepted",
  "refused",
  "expired",
  "converted",
];

export function parseInvoiceStatusFilter(
  value?: string,
): InvoiceStatusFilter {
  if (value === INVOICE_AWAITING_FILTER) return INVOICE_AWAITING_FILTER;
  if (value && INVOICE_STATUSES.includes(value as InvoiceStatus)) {
    return value as InvoiceStatus;
  }
  return "all";
}

export function parseQuoteStatusFilter(value?: string): QuoteStatusFilter {
  if (value && QUOTE_STATUSES.includes(value as QuoteStatus)) {
    return value as QuoteStatus;
  }
  return "all";
}

export function parseClientsTab(value?: string): ClientsTab {
  return value === "prospects" ? "prospects" : "clients";
}

export function invoiceMatchesStatusFilter(
  filter: InvoiceStatusFilter,
  status: string,
): boolean {
  if (filter === "all") return true;
  if (filter === INVOICE_AWAITING_FILTER) {
    return status === "sent" || status === "partially_paid";
  }
  return status === filter;
}

export function invoiceStatusFilterLabel(filter: InvoiceStatusFilter): string {
  if (filter === "all") return "Tous";
  if (filter === INVOICE_AWAITING_FILTER) return "En attente";
  return INVOICE_STATUS_LABELS[filter];
}

export const invoiceFilterChips: FilterChipOption[] = [
  { value: "all", label: "Tous" },
  { value: INVOICE_AWAITING_FILTER, label: "En attente" },
  ...INVOICE_STATUSES.map((status) => ({
    value: status,
    label: INVOICE_STATUS_LABELS[status],
  })),
];

export const quoteFilterChips: FilterChipOption[] = [
  { value: "all", label: "Tous" },
  ...QUOTE_STATUSES.map((status) => ({
    value: status,
    label: QUOTE_STATUS_LABELS[status],
  })),
];

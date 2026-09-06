import { describe, expect, it } from "vitest";
import {
  invoiceFilterChips,
  invoiceMatchesStatusFilter,
  invoiceStatusFilterLabel,
  parseClientsTab,
  parseInvoiceStatusFilter,
  parseQuoteStatusFilter,
  quoteFilterChips,
} from "@/lib/dashboard/status-filters";

describe("parseInvoiceStatusFilter", () => {
  it("accepts awaiting as the pending virtual filter", () => {
    expect(parseInvoiceStatusFilter("awaiting")).toBe("awaiting");
  });

  it("accepts a real invoice status", () => {
    expect(parseInvoiceStatusFilter("overdue")).toBe("overdue");
  });

  it("falls back to all for missing or unknown values", () => {
    expect(parseInvoiceStatusFilter(undefined)).toBe("all");
    expect(parseInvoiceStatusFilter("nope")).toBe("all");
  });
});

describe("parseQuoteStatusFilter", () => {
  it("accepts converted", () => {
    expect(parseQuoteStatusFilter("converted")).toBe("converted");
  });

  it("falls back to all for unknown values", () => {
    expect(parseQuoteStatusFilter("bogus")).toBe("all");
  });
});

describe("invoiceMatchesStatusFilter", () => {
  it("matches sent and partially_paid for awaiting", () => {
    expect(invoiceMatchesStatusFilter("awaiting", "sent")).toBe(true);
    expect(invoiceMatchesStatusFilter("awaiting", "partially_paid")).toBe(true);
    expect(invoiceMatchesStatusFilter("awaiting", "overdue")).toBe(false);
  });

  it("matches all statuses when filter is all", () => {
    expect(invoiceMatchesStatusFilter("all", "draft")).toBe(true);
  });
});

describe("filter chip options", () => {
  it("exposes Tous and En attente for invoices", () => {
    const values = invoiceFilterChips.map((chip) => chip.value);
    expect(values[0]).toBe("all");
    expect(values).toContain("awaiting");
    expect(invoiceStatusFilterLabel("awaiting")).toBe("En attente");
  });

  it("includes converted among quote chips", () => {
    expect(quoteFilterChips.map((chip) => chip.value)).toContain("converted");
  });
});

describe("parseClientsTab", () => {
  it("opens prospects from the query string", () => {
    expect(parseClientsTab("prospects")).toBe("prospects");
  });

  it("defaults to clients", () => {
    expect(parseClientsTab(undefined)).toBe("clients");
    expect(parseClientsTab("other")).toBe("clients");
  });
});

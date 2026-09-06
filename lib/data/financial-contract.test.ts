import { describe, expect, it } from "vitest";
import {
  expenseHt,
  expenseTtc,
  expensesTotalHt,
  expensesTotalTtc,
  isValidatedExpense,
  profitTtc,
} from "@/lib/data/derive";
import type { Expense } from "@/lib/data/expenses";
import { calculateVat, computeTotals, round2 } from "@/lib/tax";
import { mapExpense, mapInvoiceOrQuote, mapPayment } from "@/lib/laravel/mappers";
import { invoiceStatusFromApi } from "@/lib/laravel/enums";
import { documentBalanceDue } from "@/lib/domain/invoices";

function expense(partial: Partial<Expense> & Pick<Expense, "amountHt" | "amountTtc" | "taxAmount">): Expense {
  return {
    id: "e1",
    date: "2026-09-01",
    description: "Test",
    currency: "XOF",
    categoryId: "cat_1",
    taxRate: 18,
    taxDeductible: true,
    statut: "validee",
    ...partial,
  };
}

describe("financial formulas", () => {
  it("computes exclusive line totals with 18% VAT (XOF)", () => {
    const totals = computeTotals(
      [{ quantity: 1, unitPrice: 100_000, taxRate: 18 }],
      "exclusive",
    );
    expect(totals.subtotalHt).toBe(100_000);
    expect(totals.taxTotal).toBe(18_000);
    expect(totals.totalTtc).toBe(118_000);
  });

  it("applies line discount before VAT", () => {
    const totals = computeTotals(
      [{ quantity: 2, unitPrice: 50_000, taxRate: 18, discountPercent: 10 }],
      "exclusive",
    );
    // brut 100000 - 10% = 90000 HT, TVA 16200, TTC 106200
    expect(totals.subtotalHt).toBe(90_000);
    expect(totals.taxTotal).toBe(16_200);
    expect(totals.totalTtc).toBe(106_200);
  });

  it("converts TTC expense input to HT for storage", () => {
    const vat = calculateVat(118_000, 18, "inclusive");
    expect(vat.ttc).toBe(118_000);
    expect(round2(vat.ht)).toBe(100_000);
    expect(round2(vat.vat)).toBe(18_000);
  });

  it("sums only validated expenses for HT/TTC and profit", () => {
    const rows = [
      expense({ amountHt: 100, amountTtc: 118, taxAmount: 18, statut: "validee" }),
      expense({
        id: "e2",
        amountHt: 50,
        amountTtc: 50,
        taxAmount: 0,
        statut: "rejetee",
      }),
      expense({
        id: "e3",
        amountHt: 200,
        amountTtc: 236,
        taxAmount: 36,
        statut: "en_attente",
      }),
    ];
    expect(rows.filter(isValidatedExpense)).toHaveLength(1);
    expect(expensesTotalHt(rows)).toBe(100);
    expect(expensesTotalTtc(rows)).toBe(118);
    expect(profitTtc(500, rows)).toBe(382);
    expect(expenseHt(rows[0])).toBe(100);
    expect(expenseTtc(rows[0])).toBe(118);
  });
});

describe("expense / payment / invoice mappers", () => {
  it("maps expense HT/TVA/TTC explicitly", () => {
    const mapped = mapExpense({
      id: 1,
      libelle: "Loyer",
      montant_ht: 100000,
      montant_tva: 18000,
      montant_ttc: 118000,
      taux_tva: 18,
      devise: "XOF",
      date_depense: "2026-09-01",
      categorie_id: 2,
      statut: "validee",
    });
    expect(mapped.amountHt).toBe(100000);
    expect(mapped.taxAmount).toBe(18000);
    expect(mapped.amountTtc).toBe(118000);
    expect(mapped.statut).toBe("validee");
  });

  it("maps invoice montant_paye and balance_due", () => {
    const doc = mapInvoiceOrQuote(
      {
        id: 9,
        numero: "FAC-2026-009",
        client_id: 1,
        statut: "partiellement_payee",
        devise: "XOF",
        date_creation: "2026-09-01",
        date_echeance: "2026-09-30",
        sous_total: 100000,
        montant_tva: 18000,
        montant_total: 118000,
        montant_paye: 50000,
        balance_due: 68000,
        lines: [],
      },
      "invoice",
      "Ndiaye SARL",
    );
    expect(doc.amountPaid).toBe(50000);
    expect(doc.balanceDue).toBe(68000);
    expect(doc.clientName).toBe("Ndiaye SARL");
    expect(doc.taxMode).toBe("exclusive");
  });

  it("maps payment document_number and client_name", () => {
    const payment = mapPayment({
      id: 3,
      facture_id: 9,
      client_id: 1,
      montant: 50000,
      devise: "XOF",
      mode_paiement: "wave",
      date_paiement: "2026-09-05",
      document_number: "FAC-2026-009",
      client_name: "Ndiaye SARL",
    });
    expect(payment.documentNumber).toBe("FAC-2026-009");
    expect(payment.clientName).toBe("Ndiaye SARL");
    expect(payment.method).toBe("wave");
  });

  it("maps Laravel impayee to unpaid and never uses seed fixtures for balance", () => {
    expect(invoiceStatusFromApi("impayee")).toBe("unpaid");
    expect(
      documentBalanceDue({
        kind: "invoice",
        status: "sent",
        total: 118000,
        amountPaid: 20000,
        balanceDue: 98000,
      }),
    ).toBe(98000);
    expect(
      documentBalanceDue({
        kind: "invoice",
        status: "sent",
        total: 100,
        amountPaid: undefined,
        balanceDue: undefined,
      }),
    ).toBe(100);
  });
});

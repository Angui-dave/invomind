import type { CurrencyCode } from "@/lib/money";
import type { PaymentMethod } from "@/lib/documents";

export interface Payment {
  id: string;
  documentId: string;
  documentNumber: string;
  clientId: string;
  clientName: string;
  amount: number;
  currency: CurrencyCode;
  method: PaymentMethod;
  paidAt: string;
  reference?: string;
  notes?: string;
}

/**
 * One payment per paid/partial invoice in the seed.
 * Amounts must match document TTC (or partial for inv_08).
 * TTC = HT * 1.18 for exclusive 18 %.
 */
export const PAYMENTS: Payment[] = [
  {
    id: "pay_1",
    documentId: "inv_13",
    documentNumber: "FAC-2026-013",
    clientId: "cli_2",
    clientName: "Kofi Mensah",
    amount: 1_003_000,
    currency: "XOF",
    method: "mobile_money",
    paidAt: "2026-08-05",
    reference: "OM-882341",
  },
  {
    id: "pay_2",
    documentId: "inv_09",
    documentNumber: "FAC-2026-009",
    clientId: "cli_1",
    clientName: "Aminata Diallo",
    amount: 212_400,
    currency: "XOF",
    method: "mobile_money",
    paidAt: "2026-06-18",
    reference: "WAVE-44102",
  },
  {
    id: "pay_3",
    documentId: "inv_08",
    documentNumber: "FAC-2026-008",
    clientId: "cli_2",
    clientName: "Kofi Mensah",
    amount: 1_475_000,
    currency: "XOF",
    method: "transfer",
    paidAt: "2026-07-20",
    reference: "VIR-20260720",
    notes: "Acompte 50 %",
  },
  {
    id: "pay_4",
    documentId: "inv_07",
    documentNumber: "FAC-2026-007",
    clientId: "cli_4",
    clientName: "Ibrahim Traoré",
    amount: 1_416_000,
    currency: "XOF",
    method: "transfer",
    paidAt: "2026-04-28",
    reference: "VIR-20260428",
  },
  {
    id: "pay_5",
    documentId: "inv_06",
    documentNumber: "FAC-2026-006",
    clientId: "cli_1",
    clientName: "Aminata Diallo",
    amount: 885_000,
    currency: "XOF",
    method: "mobile_money",
    paidAt: "2026-03-25",
    reference: "WAVE-33091",
  },
  {
    id: "pay_6",
    documentId: "inv_05",
    documentNumber: "FAC-2026-005",
    clientId: "cli_3",
    clientName: "Fatou Ndiaye",
    amount: 413_000,
    currency: "XOF",
    method: "card",
    paidAt: "2026-02-28",
    reference: "CB-90211",
  },
  {
    id: "pay_7",
    documentId: "inv_04",
    documentNumber: "FAC-2026-004",
    clientId: "cli_2",
    clientName: "Kofi Mensah",
    amount: 802_400,
    currency: "XOF",
    method: "mobile_money",
    paidAt: "2026-01-30",
    reference: "OM-110294",
  },
  {
    id: "pay_8",
    documentId: "inv_03",
    documentNumber: "FAC-2025-003",
    clientId: "cli_5",
    clientName: "Aïcha Bamba",
    amount: 495_600,
    currency: "XOF",
    method: "transfer",
    paidAt: "2025-12-20",
    reference: "VIR-20251220",
  },
  {
    id: "pay_9",
    documentId: "inv_02",
    documentNumber: "FAC-2025-002",
    clientId: "cli_4",
    clientName: "Ibrahim Traoré",
    amount: 1_416_000,
    currency: "XOF",
    method: "transfer",
    paidAt: "2025-11-22",
    reference: "VIR-20251122",
  },
  {
    id: "pay_10",
    documentId: "inv_01",
    documentNumber: "FAC-2025-001",
    clientId: "cli_1",
    clientName: "Aminata Diallo",
    amount: 1_298_000,
    currency: "XOF",
    method: "mobile_money",
    paidAt: "2025-10-28",
    reference: "WAVE-22901",
  },
  {
    id: "pay_11",
    documentId: "inv_00",
    documentNumber: "FAC-2025-000",
    clientId: "cli_2",
    clientName: "Kofi Mensah",
    amount: 885_000,
    currency: "XOF",
    method: "card",
    paidAt: "2025-09-30",
    reference: "CB-77821",
  },
  {
    id: "pay_12",
    documentId: "inv_jun",
    documentNumber: "FAC-2026-015",
    clientId: "cli_3",
    clientName: "Fatou Ndiaye",
    amount: 448_400,
    currency: "XOF",
    method: "mobile_money",
    paidAt: "2026-06-25",
    reference: "WAVE-55103",
  },
];

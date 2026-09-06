import type { CurrencyCode } from "@/lib/money";

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  isGlobal?: boolean;
  actif?: boolean;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  /** Hors taxes */
  amountHt: number;
  /** TTC */
  amountTtc: number;
  currency: CurrencyCode;
  categoryId: string;
  supplierId?: string;
  supplierName?: string;
  taxRate: number;
  taxDeductible: boolean;
  taxAmount: number;
  notes?: string;
  /** Laravel depense_statut: en_attente | validee | rejetee */
  statut?: string;
  paymentMethod?: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: "cat_1", name: "Loyer & locaux", color: "#16213E" },
  { id: "cat_2", name: "Logiciels & abonnements", color: "#2F6E5B" },
  { id: "cat_3", name: "Transport & déplacements", color: "#B08D57" },
  { id: "cat_4", name: "Fournitures de bureau", color: "#C9CCC3" },
  { id: "cat_5", name: "Marketing & publicité", color: "#B23A48" },
  { id: "cat_6", name: "Services professionnels", color: "#2F6E5B" },
  { id: "cat_7", name: "Télécom & internet", color: "#16213E" },
  { id: "cat_8", name: "Autres", color: "#888888" },
];

export const EXPENSES: Expense[] = [
  {
    id: "exp_1",
    date: "2026-08-01",
    description: "Loyer bureau — août",
    amountHt: 296_610,
    amountTtc: 350_000,
    currency: "XOF",
    categoryId: "cat_1",
    supplierId: "sup_1",
    supplierName: "Immobilière Plateau",
    taxRate: 18,
    taxDeductible: true,
    taxAmount: 53_390,
    statut: "validee",
  },
  {
    id: "exp_2",
    date: "2026-08-05",
    description: "Abonnement Figma Pro",
    amountHt: 45_000,
    amountTtc: 45_000,
    currency: "XOF",
    categoryId: "cat_2",
    taxRate: 0,
    taxDeductible: false,
    taxAmount: 0,
    statut: "validee",
  },
  {
    id: "exp_3",
    date: "2026-08-08",
    description: "Déplacement client Abidjan",
    amountHt: 152_542,
    amountTtc: 180_000,
    currency: "XOF",
    categoryId: "cat_3",
    supplierId: "sup_2",
    supplierName: "Air Côte d'Ivoire",
    taxRate: 18,
    taxDeductible: true,
    taxAmount: 27_458,
    statut: "validee",
  },
  {
    id: "exp_4",
    date: "2026-07-15",
    description: "Campagne Facebook Ads",
    amountHt: 120_000,
    amountTtc: 120_000,
    currency: "XOF",
    categoryId: "cat_5",
    taxRate: 0,
    taxDeductible: false,
    taxAmount: 0,
    statut: "validee",
  },
  {
    id: "exp_5",
    date: "2026-07-01",
    description: "Fibre optique — trimestre",
    amountHt: 76_271,
    amountTtc: 90_000,
    currency: "XOF",
    categoryId: "cat_7",
    supplierId: "sup_3",
    supplierName: "Orange Business",
    taxRate: 18,
    taxDeductible: true,
    taxAmount: 13_729,
    statut: "validee",
  },
  {
    id: "exp_6",
    date: "2026-06-20",
    description: "Conseil juridique — contrat",
    amountHt: 211_864,
    amountTtc: 250_000,
    currency: "XOF",
    categoryId: "cat_6",
    supplierId: "sup_4",
    supplierName: "Cabinet Sow & Associés",
    taxRate: 18,
    taxDeductible: true,
    taxAmount: 38_136,
    statut: "validee",
  },
];

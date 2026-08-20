import type {
  BusinessDocument,
  DocumentLine,
  DocumentStatus,
  ReminderMilestoneStatus,
} from "@/lib/documents";
import { recomputeDocumentTotals } from "@/lib/documents";
import { TODAY } from "@/lib/date";
import { PAYMENTS } from "@/lib/data/payments";

function withTotals(
  doc: Omit<BusinessDocument, "total" | "subtotalHt" | "taxTotal"> &
    Partial<Pick<BusinessDocument, "total" | "subtotalHt" | "taxTotal">>,
): BusinessDocument {
  const totals = recomputeDocumentTotals(doc);
  return { ...doc, ...totals };
}

function defaultReminders(
  dueDate: string,
  states: ReminderMilestoneStatus["state"][],
): ReminderMilestoneStatus[] {
  const base = new Date(dueDate);
  const offsets = [-3, 3, 7, 14];
  const milestones = ["J-3", "J+3", "J+7", "J+14"] as const;
  return milestones.map((milestone, i) => {
    const date = new Date(base);
    date.setDate(date.getDate() + offsets[i]);
    const iso = date.toISOString().slice(0, 10);
    let state = states[i] ?? "scheduled";
    if (state === "scheduled" && iso < TODAY) {
      state = "sent";
    }
    return {
      milestone,
      state,
      date: iso,
    };
  });
}

const line = (
  id: string,
  description: string,
  quantity: number,
  unitPrice: number,
  taxRate = 18,
): DocumentLine => ({ id, description, quantity, unitPrice, taxRate });

function paidSum(documentId: string): number {
  return PAYMENTS.filter((p) => p.documentId === documentId).reduce(
    (s, p) => s + p.amount,
    0,
  );
}

function creditSum(documentId: string, docs: BusinessDocument[]): number {
  return docs
    .filter((d) => d.kind === "credit_note" && d.sourceDocumentId === documentId && d.status === "applied")
    .reduce((s, d) => s + d.total, 0);
}

export function applyDerivedStatus(
  doc: BusinessDocument,
  allDocs: BusinessDocument[] = DOCUMENTS,
): BusinessDocument {
  if (doc.kind !== "invoice") return doc;
  if (doc.status === "draft" || doc.status === "cancelled") return doc;

  const paid = paidSum(doc.id);
  const credited = creditSum(doc.id, allDocs);
  const settled = paid + credited;

  let status: DocumentStatus;
  if (settled >= doc.total - 0.01) {
    status = "paid";
  } else if (settled > 0.01) {
    status = doc.dueDate < TODAY ? "overdue" : "partially_paid";
  } else if (doc.dueDate < TODAY) {
    status = "overdue";
  } else {
    status = "sent";
  }

  return status === doc.status ? doc : { ...doc, status };
}

export const DOCUMENTS: BusinessDocument[] = [
  withTotals({
    id: "inv_14",
    kind: "invoice",
    number: "FAC-2026-014",
    clientId: "cli_1",
    clientName: "Aminata Diallo",
    status: "sent",
    currency: "XOF",
    taxMode: "exclusive",
    issueDate: "2026-08-01",
    dueDate: "2026-08-31",
    lines: [
      line("l1", "Refonte site vitrine — phase design", 1, 1_200_000),
      line("l2", "Intégration pages clés", 8, 45_000),
    ],
    onlinePaymentEnabled: true,
    paidOnlineAt: null,
    paymentMethod: null,
    remindersEnabled: true,
    reminders: defaultReminders("2026-08-31", [
      "scheduled",
      "scheduled",
      "scheduled",
      "disabled",
    ]),
    portalToken: "pt_a7k2m9xq1b",
  }),
  withTotals({
    id: "inv_13",
    kind: "invoice",
    number: "FAC-2026-013",
    clientId: "cli_2",
    clientName: "Kofi Mensah",
    status: "paid",
    currency: "XOF",
    taxMode: "exclusive",
    issueDate: "2026-07-10",
    dueDate: "2026-08-10",
    lines: [line("l1", "Identité visuelle — pack complet", 1, 850_000)],
    onlinePaymentEnabled: true,
    paidOnlineAt: "2026-08-05",
    paymentMethod: "mobile_money",
    remindersEnabled: true,
    reminders: defaultReminders("2026-08-10", [
      "sent",
      "disabled",
      "disabled",
      "disabled",
    ]),
    portalToken: "pt_b3n8p4wr2c",
  }),
  withTotals({
    id: "inv_12",
    kind: "invoice",
    number: "FAC-2026-012",
    clientId: "cli_4",
    clientName: "Ibrahim Traoré",
    status: "overdue",
    currency: "XOF",
    taxMode: "exclusive",
    issueDate: "2026-06-15",
    dueDate: "2026-07-15",
    lines: [
      line("l1", "Audit UX application mobile", 1, 650_000),
      line("l2", "Rapport de recommandations", 1, 250_000),
    ],
    onlinePaymentEnabled: true,
    paidOnlineAt: null,
    paymentMethod: null,
    remindersEnabled: true,
    reminders: defaultReminders("2026-07-15", [
      "sent",
      "sent",
      "sent",
      "sent",
    ]),
    portalToken: "pt_c5q1s7yt3d",
  }),
  withTotals({
    id: "inv_11",
    kind: "invoice",
    number: "FAC-2026-011",
    clientId: "cli_3",
    clientName: "Fatou Ndiaye",
    status: "sent",
    currency: "XOF",
    taxMode: "exclusive",
    issueDate: "2026-08-05",
    dueDate: "2026-09-05",
    lines: [line("l1", "Photographie produit — 20 clichés", 1, 450_000)],
    onlinePaymentEnabled: false,
    paidOnlineAt: null,
    paymentMethod: null,
    remindersEnabled: false,
    reminders: defaultReminders("2026-09-05", [
      "disabled",
      "disabled",
      "disabled",
      "disabled",
    ]),
    portalToken: "pt_d9u6v2za4e",
  }),
  withTotals({
    id: "inv_10",
    kind: "invoice",
    number: "FAC-2026-010",
    clientId: "cli_5",
    clientName: "Aïcha Bamba",
    status: "draft",
    currency: "XOF",
    taxMode: "exclusive",
    issueDate: "2026-08-12",
    dueDate: "2026-09-12",
    lines: [line("l1", "Accompagnement stratégique Q3", 12, 75_000)],
    onlinePaymentEnabled: true,
    paidOnlineAt: null,
    paymentMethod: null,
    remindersEnabled: true,
    reminders: defaultReminders("2026-09-12", [
      "scheduled",
      "scheduled",
      "scheduled",
      "scheduled",
    ]),
    portalToken: "pt_e1w4x8bc5f",
  }),
  withTotals({
    id: "inv_09",
    kind: "invoice",
    number: "FAC-2026-009",
    clientId: "cli_1",
    clientName: "Aminata Diallo",
    status: "paid",
    currency: "XOF",
    taxMode: "exclusive",
    issueDate: "2026-05-20",
    dueDate: "2026-06-20",
    lines: [line("l1", "Maintenance mensuelle — mai", 1, 180_000)],
    onlinePaymentEnabled: true,
    paidOnlineAt: "2026-06-18",
    paymentMethod: "mobile_money",
    remindersEnabled: true,
    reminders: defaultReminders("2026-06-20", [
      "sent",
      "disabled",
      "disabled",
      "disabled",
    ]),
    portalToken: "pt_f2y7z3de6g",
  }),
  withTotals({
    id: "inv_08",
    kind: "invoice",
    number: "FAC-2026-008",
    clientId: "cli_2",
    clientName: "Kofi Mensah",
    status: "partially_paid",
    currency: "XOF",
    taxMode: "exclusive",
    issueDate: "2026-07-01",
    dueDate: "2026-08-01",
    lines: [line("l1", "Développement application web — phase 1", 1, 2_500_000)],
    onlinePaymentEnabled: true,
    paidOnlineAt: null,
    paymentMethod: null,
    remindersEnabled: true,
    reminders: defaultReminders("2026-08-01", [
      "sent",
      "sent",
      "sent",
      "scheduled",
    ]),
    portalToken: "pt_g3a8b4fg7h",
  }),
  withTotals({
    id: "inv_07",
    kind: "invoice",
    number: "FAC-2026-007",
    clientId: "cli_4",
    clientName: "Ibrahim Traoré",
    status: "paid",
    currency: "XOF",
    taxMode: "exclusive",
    issueDate: "2026-04-05",
    dueDate: "2026-05-05",
    lines: [line("l1", "Formation équipe commerciale — pack", 3, 400_000)],
    onlinePaymentEnabled: true,
    paidOnlineAt: "2026-04-28",
    paymentMethod: "transfer",
    remindersEnabled: false,
    reminders: [],
    portalToken: "pt_h4c9d5hi8i",
  }),
  withTotals({
    id: "inv_06",
    kind: "invoice",
    number: "FAC-2026-006",
    clientId: "cli_1",
    clientName: "Aminata Diallo",
    status: "paid",
    currency: "XOF",
    taxMode: "exclusive",
    issueDate: "2026-03-10",
    dueDate: "2026-04-10",
    lines: [
      line("l1", "Campagne contenu réseaux — mars", 1, 550_000),
      line("l2", "Community management", 1, 200_000),
    ],
    onlinePaymentEnabled: true,
    paidOnlineAt: "2026-03-25",
    paymentMethod: "mobile_money",
    remindersEnabled: false,
    reminders: [],
    portalToken: "pt_i5e0f6jk9j",
  }),
  withTotals({
    id: "inv_05",
    kind: "invoice",
    number: "FAC-2026-005",
    clientId: "cli_3",
    clientName: "Fatou Ndiaye",
    status: "paid",
    currency: "XOF",
    taxMode: "exclusive",
    issueDate: "2026-02-12",
    dueDate: "2026-03-12",
    lines: [line("l1", "Audit SEO & recommandations", 1, 350_000)],
    onlinePaymentEnabled: true,
    paidOnlineAt: "2026-02-28",
    paymentMethod: "card",
    remindersEnabled: false,
    reminders: [],
    portalToken: "pt_j6g1h7kl0k",
  }),
  withTotals({
    id: "inv_04",
    kind: "invoice",
    number: "FAC-2026-004",
    clientId: "cli_2",
    clientName: "Kofi Mensah",
    status: "paid",
    currency: "XOF",
    taxMode: "exclusive",
    issueDate: "2026-01-15",
    dueDate: "2026-02-15",
    lines: [line("l1", "Développement landing page", 1, 680_000)],
    onlinePaymentEnabled: true,
    paidOnlineAt: "2026-01-30",
    paymentMethod: "mobile_money",
    remindersEnabled: false,
    reminders: [],
    portalToken: "pt_k7i2j8mn1l",
  }),
  withTotals({
    id: "inv_03",
    kind: "invoice",
    number: "FAC-2025-003",
    clientId: "cli_5",
    clientName: "Aïcha Bamba",
    status: "paid",
    currency: "XOF",
    taxMode: "exclusive",
    issueDate: "2025-12-08",
    dueDate: "2026-01-08",
    lines: [line("l1", "Création de contenu — pack mensuel", 1, 420_000)],
    onlinePaymentEnabled: true,
    paidOnlineAt: "2025-12-20",
    paymentMethod: "transfer",
    remindersEnabled: false,
    reminders: [],
    portalToken: "pt_l8k3l9op2m",
  }),
  withTotals({
    id: "inv_02",
    kind: "invoice",
    number: "FAC-2025-002",
    clientId: "cli_4",
    clientName: "Ibrahim Traoré",
    status: "paid",
    currency: "XOF",
    taxMode: "exclusive",
    issueDate: "2025-11-05",
    dueDate: "2025-12-05",
    lines: [
      line("l1", "Refonte catalogue produits", 1, 900_000),
      line("l2", "Formation équipe", 2, 150_000),
    ],
    onlinePaymentEnabled: true,
    paidOnlineAt: "2025-11-22",
    paymentMethod: "transfer",
    remindersEnabled: false,
    reminders: [],
    portalToken: "pt_m9n4o0qr3n",
  }),
  withTotals({
    id: "inv_01",
    kind: "invoice",
    number: "FAC-2025-001",
    clientId: "cli_1",
    clientName: "Aminata Diallo",
    status: "paid",
    currency: "XOF",
    taxMode: "exclusive",
    issueDate: "2025-10-10",
    dueDate: "2025-11-10",
    lines: [line("l1", "Site vitrine — lancement", 1, 1_100_000)],
    onlinePaymentEnabled: true,
    paidOnlineAt: "2025-10-28",
    paymentMethod: "mobile_money",
    remindersEnabled: false,
    reminders: [],
    portalToken: "pt_n0p5q1st4o",
  }),
  withTotals({
    id: "inv_00",
    kind: "invoice",
    number: "FAC-2025-000",
    clientId: "cli_2",
    clientName: "Kofi Mensah",
    status: "paid",
    currency: "XOF",
    taxMode: "exclusive",
    issueDate: "2025-09-15",
    dueDate: "2025-10-15",
    lines: [line("l1", "Audit technique & feuille de route", 1, 750_000)],
    onlinePaymentEnabled: true,
    paidOnlineAt: "2025-09-30",
    paymentMethod: "card",
    remindersEnabled: false,
    reminders: [],
    portalToken: "pt_o1r6s2uv5p",
  }),
  withTotals({
    id: "inv_jun",
    kind: "invoice",
    number: "FAC-2026-015",
    clientId: "cli_3",
    clientName: "Fatou Ndiaye",
    status: "paid",
    currency: "XOF",
    taxMode: "exclusive",
    issueDate: "2026-06-02",
    dueDate: "2026-07-02",
    lines: [line("l1", "Shooting corporate", 1, 380_000)],
    onlinePaymentEnabled: true,
    paidOnlineAt: "2026-06-25",
    paymentMethod: "mobile_money",
    remindersEnabled: false,
    reminders: [],
    portalToken: "pt_p2t7u3wx6q",
  }),
  withTotals({
    id: "quo_03",
    kind: "quote",
    number: "DEV-2026-003",
    clientId: "cli_3",
    clientName: "Fatou Ndiaye",
    status: "sent",
    currency: "XOF",
    taxMode: "exclusive",
    issueDate: "2026-08-10",
    dueDate: "2026-08-25",
    lines: [
      line("l1", "Audit SEO & recommandations", 1, 350_000),
      line("l2", "Optimisation technique", 5, 40_000),
    ],
    onlinePaymentEnabled: false,
    paidOnlineAt: null,
    paymentMethod: null,
    remindersEnabled: false,
    reminders: [],
    portalToken: "pt_q3v8w4yz7r",
  }),
  withTotals({
    id: "quo_02",
    kind: "quote",
    number: "DEV-2026-002",
    clientId: "cli_4",
    clientName: "Ibrahim Traoré",
    status: "accepted",
    currency: "XOF",
    taxMode: "exclusive",
    issueDate: "2026-07-20",
    dueDate: "2026-08-05",
    lines: [line("l1", "Formation équipe commerciale — 2 jours", 2, 400_000)],
    onlinePaymentEnabled: false,
    paidOnlineAt: null,
    paymentMethod: null,
    remindersEnabled: false,
    reminders: [],
    portalToken: "pt_r4x9y5ab8s",
  }),
  withTotals({
    id: "quo_01",
    kind: "quote",
    number: "DEV-2026-001",
    clientId: "cli_5",
    clientName: "Aïcha Bamba",
    status: "draft",
    currency: "XOF",
    taxMode: "exclusive",
    issueDate: "2026-08-14",
    dueDate: "2026-08-28",
    lines: [line("l1", "Création de contenu réseaux sociaux — pack mensuel", 1, 220_000)],
    onlinePaymentEnabled: false,
    paidOnlineAt: null,
    paymentMethod: null,
    remindersEnabled: false,
    reminders: [],
    portalToken: "pt_s5z0a6cd9t",
  }),
  withTotals({
    id: "cn_01",
    kind: "credit_note",
    number: "AV-2026-001",
    clientId: "cli_1",
    clientName: "Aminata Diallo",
    status: "issued",
    currency: "XOF",
    taxMode: "exclusive",
    issueDate: "2026-06-25",
    dueDate: "2026-06-25",
    lines: [line("l1", "Avoir — correction maintenance mai", 1, 50_000)],
    onlinePaymentEnabled: false,
    paidOnlineAt: null,
    paymentMethod: null,
    remindersEnabled: false,
    reminders: [],
    portalToken: "pt_t6b1c7ef0u",
    sourceDocumentId: "inv_09",
  }),
];

export function getInvoices(): BusinessDocument[] {
  return DOCUMENTS.filter((d) => d.kind === "invoice").map((d) =>
    applyDerivedStatus(d),
  );
}

export function getQuotes(): BusinessDocument[] {
  return DOCUMENTS.filter((d) => d.kind === "quote");
}

export function getCreditNotes(): BusinessDocument[] {
  return DOCUMENTS.filter((d) => d.kind === "credit_note");
}

/** Live getters via Proxy so spread/filter still work on legacy INVOICES usage */
function liveList(getter: () => BusinessDocument[]): BusinessDocument[] {
  return new Proxy([] as BusinessDocument[], {
    get(_target, prop) {
      const list = getter();
      const value = Reflect.get(list, prop, list);
      return typeof value === "function" ? value.bind(list) : value;
    },
    ownKeys() {
      return Reflect.ownKeys(getter());
    },
    getOwnPropertyDescriptor(_t, prop) {
      return Reflect.getOwnPropertyDescriptor(getter(), prop);
    },
    has(_t, prop) {
      return Reflect.has(getter(), prop);
    },
  });
}

export const INVOICES = liveList(getInvoices);
export const QUOTES = liveList(getQuotes);
export const CREDIT_NOTES = liveList(getCreditNotes);

export const HERO_INVOICE: BusinessDocument = getInvoices()[0];

export function getInvoiceById(id: string): BusinessDocument | undefined {
  const doc = DOCUMENTS.find((d) => d.id === id);
  return doc ? applyDerivedStatus(doc) : undefined;
}

export function getInvoiceByToken(token: string): BusinessDocument | undefined {
  const doc = DOCUMENTS.find(
    (d) => d.portalToken === token && d.kind === "invoice",
  );
  return doc ? applyDerivedStatus(doc) : undefined;
}

export function getDocumentById(id: string): BusinessDocument | undefined {
  const doc = DOCUMENTS.find((d) => d.id === id);
  return doc ? applyDerivedStatus(doc) : undefined;
}

export function invoiceStatusCounts(): Record<string, number> {
  return getInvoices().reduce(
    (acc, inv) => {
      acc[inv.status] = (acc[inv.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
}

export function pendingInvoiceCount(): number {
  return getInvoices().filter(
    (d) => d.status === "sent" || d.status === "partially_paid",
  ).length;
}

export function overdueInvoiceCount(): number {
  return getInvoices().filter((d) => d.status === "overdue").length;
}

export type Invoice = BusinessDocument;
export type InvoiceLine = import("@/lib/documents").DocumentLine;

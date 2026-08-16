import "server-only";
import { verifySession } from "@/lib/dal/session";
import {
  findTenantIdByPortalToken,
  tenantStore,
  tenantStoreById,
  type MockStore,
} from "@/lib/mock/store";
import type { Client } from "@/lib/data/clients";
import type { BusinessDocument } from "@/lib/documents";
import { applyDerivedStatus } from "@/lib/data/documents";
import { TODAY } from "@/lib/date";

function withStatus(doc: BusinessDocument, store: MockStore): BusinessDocument {
  if (doc.kind !== "invoice") return doc;
  if (doc.status === "draft" || doc.status === "cancelled") return doc;

  const paid = store.payments
    .filter((p) => p.documentId === doc.id)
    .reduce((s, p) => s + p.amount, 0);
  const credited = store.documents
    .filter((d) => d.kind === "credit_note" && d.sourceDocumentId === doc.id)
    .reduce((s, d) => s + d.total, 0);
  const settled = paid + credited;
  const today = TODAY;

  let status = doc.status;
  if (settled >= doc.total - 0.01) status = "paid";
  else if (settled > 0.01) status = doc.dueDate < today ? "overdue" : "partially_paid";
  else if (doc.dueDate < today) status = "overdue";
  else status = "sent";

  return status === doc.status ? doc : { ...doc, status };
}

export async function listClients(): Promise<Client[]> {
  await verifySession();
  const store = await tenantStore();
  return [...store.clients].sort((a, b) =>
    a.name.localeCompare(b.name, "fr"),
  );
}

export async function getClientById(id: string): Promise<Client | null> {
  await verifySession();
  const store = await tenantStore();
  return store.clients.find((c) => c.id === id) ?? null;
}

export async function listDocuments(
  kind?: BusinessDocument["kind"],
): Promise<BusinessDocument[]> {
  await verifySession();
  const store = await tenantStore();
  const docs = store.documents.filter((d) =>
    kind ? d.kind === kind : true,
  );
  return docs
    .map((d) => withStatus(d, store))
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
}

export async function getInvoices(): Promise<BusinessDocument[]> {
  return listDocuments("invoice");
}

export async function getQuotes(): Promise<BusinessDocument[]> {
  return listDocuments("quote");
}

export async function getCreditNotes(): Promise<BusinessDocument[]> {
  return listDocuments("credit_note");
}

export async function getDocumentById(
  id: string,
): Promise<BusinessDocument | null> {
  await verifySession();
  const store = await tenantStore();
  const doc = store.documents.find((d) => d.id === id);
  return doc ? withStatus(doc, store) : null;
}

export async function getInvoiceByToken(
  token: string,
): Promise<BusinessDocument | null> {
  const tenantId = findTenantIdByPortalToken(token);
  if (!tenantId) return null;
  const store = tenantStoreById(tenantId);
  const doc = store.documents.find(
    (d) => d.portalToken === token && d.kind === "invoice",
  );
  return doc ? withStatus(doc, store) : null;
}

export async function invoiceCountFor(clientId: string): Promise<number> {
  const invoices = await getInvoices();
  return invoices.filter((d) => d.clientId === clientId).length;
}

export async function latestOpenInvoiceToken(
  clientId: string,
): Promise<string | null> {
  const invoices = await getInvoices();
  const open = invoices
    .filter(
      (d) =>
        d.clientId === clientId &&
        (d.status === "sent" ||
          d.status === "partially_paid" ||
          d.status === "overdue"),
    )
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  return open[0]?.portalToken ?? null;
}

export async function pendingInvoiceCount(): Promise<number> {
  const invoices = await getInvoices();
  return invoices.filter(
    (i) =>
      i.status === "sent" ||
      i.status === "partially_paid" ||
      i.status === "overdue",
  ).length;
}

export async function overdueInvoiceCount(): Promise<number> {
  const invoices = await getInvoices();
  return invoices.filter((i) => i.status === "overdue").length;
}

export async function allocateDocumentNumber(
  kind: BusinessDocument["kind"],
): Promise<string> {
  await verifySession();
  const store = await tenantStore();
  const year = new Date().getFullYear();
  const prefix =
    kind === "invoice" ? "FAC" : kind === "quote" ? "DEV" : "AV";
  const docs = store.documents.filter((d) => d.kind === kind);
  const max = docs.reduce((acc, r) => {
    if (!r.number.startsWith(`${prefix}-${year}-`)) return acc;
    const n = Number(r.number.split("-").pop());
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `${prefix}-${year}-${String(max + 1).padStart(3, "0")}`;
}

// silence unused import if tree-shaken oddly
void applyDerivedStatus;

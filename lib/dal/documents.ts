import "server-only";
import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import {
  mapBranding,
  mapClient,
  mapDocument,
  mapOrgSettings,
  mapPayment,
} from "@/lib/laravel/mappers";
import {
  findTenantIdByPortalToken,
  tenantStore,
  tenantStoreById,
  type MockStore,
} from "@/lib/mock/store";
import type { Client } from "@/lib/data/clients";
import type { OrgBranding, OrgSettings } from "@/lib/data/settings";
import { DEFAULT_ORG_SETTINGS } from "@/lib/data/settings";
import type { BusinessDocument } from "@/lib/documents";
import type { Payment } from "@/lib/data/payments";
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
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    const token = (await readSessionCookie())?.accessToken;
    const rows = await laravelRequest<unknown[]>("/clients", {
      token,
      organizationId: session.organizationId,
    });
    return rows.map(mapClient).sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }
  const store = await tenantStore();
  return [...store.clients].sort((a, b) =>
    a.name.localeCompare(b.name, "fr"),
  );
}

export async function getClientById(id: string): Promise<Client | null> {
  await verifySession();
  if (isLaravelApiEnabled()) {
    const clients = await listClients();
    return clients.find((c) => c.id === id) ?? null;
  }
  const store = await tenantStore();
  return store.clients.find((c) => c.id === id) ?? null;
}

export async function listDocuments(
  kind?: BusinessDocument["kind"],
): Promise<BusinessDocument[]> {
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    const token = (await readSessionCookie())?.accessToken;
    const query = kind ? `/documents?kind=${kind}` : "/documents";
    const rows = await laravelRequest<unknown[]>(query, {
      token,
      organizationId: session.organizationId,
    });
    return rows
      .map(mapDocument)
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  }
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
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    const token = (await readSessionCookie())?.accessToken;
    try {
      const row = await laravelRequest<unknown>(`/documents/${id}`, {
        token,
        organizationId: session.organizationId,
      });
      return mapDocument(row);
    } catch {
      return null;
    }
  }
  const store = await tenantStore();
  const doc = store.documents.find((d) => d.id === id);
  return doc ? withStatus(doc, store) : null;
}

export async function getInvoiceByToken(
  token: string,
): Promise<BusinessDocument | null> {
  if (isLaravelApiEnabled()) {
    try {
      const payload = await laravelRequest<{ document: unknown }>(`/portal/${token}`);
      return payload.document ? mapDocument(payload.document) : null;
    } catch {
      return null;
    }
  }
  const tenantId = findTenantIdByPortalToken(token);
  if (!tenantId) return null;
  const store = tenantStoreById(tenantId);
  const doc = store.documents.find(
    (d) => d.portalToken === token && d.kind === "invoice",
  );
  return doc ? withStatus(doc, store) : null;
}

type PortalContext = {
  invoice: BusinessDocument;
  payments: Payment[];
  client: Client | null;
  orgSettings: OrgSettings;
  branding: OrgBranding | null;
};

type ApiPortalPayload = {
  document?: unknown;
  payments?: unknown[];
  client?: unknown;
  organization?: {
    settings?: unknown;
    branding?: unknown;
  } | null;
};

export async function getPortalInvoiceContext(
  token: string,
): Promise<PortalContext | null> {
  if (isLaravelApiEnabled()) {
    try {
      const payload = await laravelRequest<ApiPortalPayload>(`/portal/${token}`);
      if (!payload.document) return null;
      return {
        invoice: mapDocument(payload.document),
        payments: Array.isArray(payload.payments)
          ? payload.payments.map(mapPayment)
          : [],
        client: payload.client ? mapClient(payload.client) : null,
        orgSettings: mapOrgSettings(payload.organization?.settings),
        branding: payload.organization?.branding
          ? mapBranding(payload.organization.branding)
          : null,
      };
    } catch {
      return null;
    }
  }

  const tenantId = findTenantIdByPortalToken(token);
  if (!tenantId) return null;
  const store = tenantStoreById(tenantId);
  const doc = store.documents.find(
    (item) => item.portalToken === token && item.kind === "invoice",
  );
  if (!doc) return null;

  return {
    invoice: withStatus(doc, store),
    payments: store.payments.filter((payment) => payment.documentId === doc.id),
    client: store.clients.find((item) => item.id === doc.clientId) ?? null,
    orgSettings: store.orgSettings ?? DEFAULT_ORG_SETTINGS,
    branding: store.branding ?? null,
  };
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
  if (isLaravelApiEnabled()) {
    const year = new Date().getFullYear();
    const prefix = kind === "invoice" ? "FAC" : kind === "quote" ? "DEV" : "AV";
    const docs = await listDocuments(kind);
    const max = docs.reduce((acc, r) => {
      if (!r.number.startsWith(`${prefix}-${year}-`)) return acc;
      const n = Number(r.number.split("-").pop());
      return Number.isFinite(n) ? Math.max(acc, n) : acc;
    }, 0);
    return `${prefix}-${year}-${String(max + 1).padStart(3, "0")}`;
  }
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

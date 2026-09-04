import "server-only";
import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { getApiContext } from "@/lib/laravel/context";
import { unwrapList } from "@/lib/laravel/pagination";
import {
  mapClient,
  mapInvoiceOrQuote,
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
import type { BusinessDocument, PortalPaymentStatus } from "@/lib/documents";
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
    .filter(
      (d) =>
        d.kind === "credit_note" &&
        d.sourceDocumentId === doc.id &&
        d.status === "applied",
    )
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
        const rows = unwrapList(
          await laravelRequest<unknown>("/clients", {
            token,
            organizationId: session.organizationId,
          }),
        );
        return rows.map(mapClient).sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }
  const store = await tenantStore();
  return [...store.clients].sort((a, b) =>
    a.name.localeCompare(b.name, "fr"),
  );
}

export async function getClientById(id: string): Promise<Client | null> {
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    const token = (await readSessionCookie())?.accessToken;
    try {
      const row = await laravelRequest<unknown>(`/clients/${id}`, {
        token,
        organizationId: session.organizationId,
      });
      return mapClient(row);
    } catch {
      return null;
    }
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
    if (kind === "credit_note") {
      return [];
    }

    const path =
      kind === "quote" ? "/quotes" : kind === "invoice" ? "/invoices" : null;
    if (!path) {
      const [invoices, quotes] = await Promise.all([
        listDocuments("invoice"),
        listDocuments("quote"),
      ]);
      return [...invoices, ...quotes].sort((a, b) =>
        b.issueDate.localeCompare(a.issueDate),
      );
    }

    const [rows, clients] = await Promise.all([
      unwrapList(
        await laravelRequest<unknown>(path, {
          token,
          organizationId: session.organizationId,
        }),
      ),
      listClients(),
    ]);
    const docKind = kind as "invoice" | "quote";
    const byId = new Map(clients.map((c) => [c.id, c.name]));
    return rows
      .map((row) => {
        const doc = mapInvoiceOrQuote(row, docKind);
        return {
          ...doc,
          clientName: byId.get(doc.clientId) ?? doc.clientName,
        };
      })
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
    for (const [path, kind] of [
      [`/invoices/${id}`, "invoice"],
      [`/quotes/${id}`, "quote"],
    ] as const) {
      try {
        const row = await laravelRequest<unknown>(path, {
          token,
          organizationId: session.organizationId,
        });
        const doc = mapInvoiceOrQuote(row, kind);
        if (doc.clientId) {
          const client = await getClientById(doc.clientId);
          if (client) return { ...doc, clientName: client.name };
        }
        return doc;
      } catch {
        // try next resource
      }
    }
    return null;
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
      // Portal returns InvoiceResource (bare), not { document: … }.
      const row = await laravelRequest<unknown>(`/portal/${token}`);
      const doc = mapInvoiceOrQuote(row, "invoice");
      if (doc.clientId) {
        // Public portal — no tenant cookie; client name may stay empty.
        return doc;
      }
      return doc;
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
  outstandingBalance: number;
  paymentStatus: PortalPaymentStatus;
};

function parsePortalPaymentStatus(value: unknown): PortalPaymentStatus | null {
  if (
    value === "unpaid" ||
    value === "processing" ||
    value === "paid" ||
    value === "partially_paid" ||
    value === "failed"
  ) {
    return value;
  }
  return null;
}

export async function getPortalInvoiceContext(
  token: string,
): Promise<PortalContext | null> {
  if (isLaravelApiEnabled()) {
    try {
      // Current API: bare InvoiceResource with montant_paye.
      const row = await laravelRequest<Record<string, unknown>>(
        `/portal/${token}`,
      );
      const invoice = mapInvoiceOrQuote(row, "invoice");
      const montantPaye = Number(row.montant_paye ?? 0);
      const outstanding = Math.max(0, invoice.total - montantPaye);
      const paymentStatus: PortalPaymentStatus =
        outstanding <= 0.01
          ? "paid"
          : montantPaye > 0.01
            ? "partially_paid"
            : "unpaid";

      return {
        invoice,
        payments: [],
        client: null,
        orgSettings: DEFAULT_ORG_SETTINGS,
        branding: null,
        outstandingBalance: Math.round(outstanding * 100) / 100,
        paymentStatus:
          parsePortalPaymentStatus(row.payment_status) ?? paymentStatus,
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

  const invoice = withStatus(doc, store);
  const payments = store.payments.filter(
    (payment) => payment.documentId === doc.id,
  );
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return {
    invoice,
    payments,
    client: store.clients.find((item) => item.id === doc.clientId) ?? null,
    orgSettings: store.orgSettings ?? DEFAULT_ORG_SETTINGS,
    branding: store.branding ?? null,
    outstandingBalance: Math.max(
      0,
      Math.round((invoice.total - paid) * 100) / 100,
    ),
    paymentStatus:
      invoice.status === "paid"
        ? "paid"
        : invoice.status === "partially_paid"
          ? "partially_paid"
          : "unpaid",
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
  if (isLaravelApiEnabled()) {
    const { token, organizationId } = await getApiContext();
    const dashboard = await laravelRequest<{ pending_invoice_count?: number }>(
      "/reports/dashboard",
      { token, organizationId },
    );
    return Number(dashboard.pending_invoice_count ?? 0);
  }
  const invoices = await getInvoices();
  return invoices.filter(
    (i) => i.status === "sent" || i.status === "partially_paid",
  ).length;
}

export async function overdueInvoiceCount(): Promise<number> {
  if (isLaravelApiEnabled()) {
    const { token, organizationId } = await getApiContext();
    const dashboard = await laravelRequest<{ overdue_invoice_count?: number }>(
      "/reports/dashboard",
      { token, organizationId },
    );
    return Number(dashboard.overdue_invoice_count ?? 0);
  }
  const invoices = await getInvoices();
  return invoices.filter((i) => i.status === "overdue").length;
}

export async function allocateDocumentNumber(
  kind: BusinessDocument["kind"],
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = kind === "invoice" ? "FAC" : kind === "quote" ? "DEV" : "AV";

  // Laravel allocates a provisional BROUILLON-* number on create, then the
  // definitive FAC/DEV/AV sequence on issue. Preview the same contract.
  if (isLaravelApiEnabled()) {
    return `BROUILLON-${prefix}`;
  }

  await verifySession();
  const store = await tenantStore();
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

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { actionErrorMessage } from "@/lib/laravel/action-errors";
import { getApiContext } from "@/lib/laravel/context";
import {
  invoiceStatusToApi,
  quoteStatusToApi,
} from "@/lib/laravel/enums";
import {
  toLaravelInvoiceBody,
  toLaravelQuoteBody,
} from "@/lib/laravel/payloads";
import { assertCanCreateInvoice } from "@/lib/billing/entitlements";
import { allocateDocumentNumber } from "@/lib/dal/documents";
import { tenantStore } from "@/lib/mock/store";
import {
  opaquePortalToken,
  recomputeDocumentTotals,
  type DocumentLine,
  type PaymentMethod,
  REMINDER_DEFAULTS,
} from "@/lib/documents";
import type { CurrencyCode } from "@/lib/money";
import type { TaxMode } from "@/lib/tax";
import type { BusinessDocument } from "@/lib/documents";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

const LineSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1),
  quantity: z.coerce.number(),
  unitPrice: z.coerce.number(),
  taxRate: z.coerce.number(),
  discountPercent: z.coerce.number().optional(),
  catalogItemId: z.union([z.string(), z.number()]).optional(),
  unit: z.string().optional(),
});

const DocumentInputSchema = z.object({
  kind: z.enum(["quote", "invoice", "credit_note"]),
  clientId: z.union([z.string(), z.number()]).transform(String),
  status: z.string(),
  currency: z.string().min(1).default("XOF"),
  taxMode: z
    .enum(["inclusive", "exclusive"])
    .catch("exclusive")
    .default("exclusive"),
  issueDate: z.string(),
  dueDate: z.string().optional().default(""),
  lines: z.array(LineSchema).min(1),
  onlinePaymentEnabled: z.boolean().default(false),
  remindersEnabled: z.boolean().default(true),
  notes: z.string().optional(),
  sourceDocumentId: z.union([z.string(), z.number()]).optional(),
  paymentMethod: z.string().nullable().optional(),
});

function formatZodError(error: z.ZodError): string {
  const first = error.issues[0];
  if (!first) return "Document invalide";
  const path = first.path.join(".") || "document";
  return `Document invalide (${path}: ${first.message})`;
}

export async function saveDocument(
  id: string | null,
  input: z.infer<typeof DocumentInputSchema>,
): Promise<ActionResult> {
  if (isLaravelApiEnabled()) {
    const parsed = DocumentInputSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: formatZodError(parsed.error) };
    }
    const data = parsed.data;

    if (data.kind === "credit_note") {
      return {
        ok: false,
        error: "Les avoirs ne sont pas encore supportés par l’API.",
      };
    }

    try {
      const { token, organizationId } = await getApiContext();
      const resource = data.kind === "quote" ? "quotes" : "invoices";
      const body =
        data.kind === "quote"
          ? toLaravelQuoteBody({
              clientId: data.clientId,
              dueDate: data.dueDate,
              currency: data.currency,
              notes: data.notes,
              lines: data.lines,
            })
          : toLaravelInvoiceBody({
              clientId: data.clientId,
              sourceDocumentId: data.sourceDocumentId,
              dueDate: data.dueDate,
              currency: data.currency,
              notes: data.notes,
              lines: data.lines,
            });

      const doc = await laravelRequest<{ id: string | number }>(
        id ? `/${resource}/${id}` : `/${resource}`,
        {
          method: id ? "PUT" : "POST",
          token,
          organizationId,
          body,
        },
      );
      const docId = String(doc.id);
      revalidatePath("/invoices");
      revalidatePath("/quotes");
      revalidatePath("/dashboard");
      revalidatePath(`/invoices/${docId}`);
      revalidatePath(`/quotes/${docId}`);
      return { ok: true, id: docId };
    } catch (error) {
      return {
        ok: false,
        error: actionErrorMessage(error, "Enregistrement impossible"),
      };
    }
  }
  const session = await verifySession();
  const parsed = DocumentInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const data = parsed.data;
  if (!id && data.kind === "invoice") {
    try {
      await assertCanCreateInvoice(
        session.organizationId,
        session.organization.planId,
      );
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Limite atteinte",
      };
    }
  }

  const store = await tenantStore();
  const client = store.clients.find((c) => c.id === data.clientId);
  if (!client) return { ok: false, error: "Client introuvable" };

  const lines: DocumentLine[] = data.lines.map((l, i) => ({
    id: l.id ?? `line_${i}_${Math.random().toString(36).slice(2, 6)}`,
    description: l.description,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    taxRate: l.taxRate,
    discountPercent: l.discountPercent,
    catalogItemId: l.catalogItemId != null ? String(l.catalogItemId) : undefined,
    unit: l.unit,
  }));

  const totals = recomputeDocumentTotals({
    lines,
    taxMode: data.taxMode as TaxMode,
  });

  const reminders = data.remindersEnabled
    ? REMINDER_DEFAULTS.map((milestone) => ({
        milestone,
        state: "scheduled" as const,
        date: data.dueDate,
      }))
    : [];

  if (id) {
    const idx = store.documents.findIndex((d) => d.id === id);
    if (idx < 0) return { ok: false, error: "Document introuvable" };
    store.documents[idx] = {
      ...store.documents[idx],
      clientId: data.clientId,
      clientName: client.name,
      status: data.status as BusinessDocument["status"],
      currency: data.currency as CurrencyCode,
      taxMode: data.taxMode as TaxMode,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      lines,
      ...totals,
      onlinePaymentEnabled: data.onlinePaymentEnabled,
      remindersEnabled: data.remindersEnabled,
      reminders,
      notes: data.notes,
      paymentMethod: (data.paymentMethod as PaymentMethod | null) ?? null,
      sourceDocumentId:
        data.sourceDocumentId != null
          ? String(data.sourceDocumentId)
          : undefined,
    };
  } else {
    const number = await allocateDocumentNumber(data.kind);
    const docId = `${data.kind === "invoice" ? "inv" : data.kind === "quote" ? "quo" : "cn"}_${Math.random().toString(36).slice(2, 8)}`;
    store.documents.unshift({
      id: docId,
      kind: data.kind,
      number,
      clientId: data.clientId,
      clientName: client.name,
      status: data.status as BusinessDocument["status"],
      currency: data.currency as CurrencyCode,
      taxMode: data.taxMode as TaxMode,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      lines,
      ...totals,
      onlinePaymentEnabled: data.onlinePaymentEnabled,
      paidOnlineAt: null,
      paymentMethod: (data.paymentMethod as PaymentMethod | null) ?? null,
      remindersEnabled: data.remindersEnabled,
      reminders,
      portalToken: opaquePortalToken(),
      sourceDocumentId:
        data.sourceDocumentId != null
          ? String(data.sourceDocumentId)
          : undefined,
      notes: data.notes,
    });
    id = docId;
  }

  revalidatePath("/invoices");
  revalidatePath("/quotes");
  revalidatePath("/dashboard");
  if (id) {
    revalidatePath(`/invoices/${id}`);
    revalidatePath(`/quotes/${id}`);
  }
  return { ok: true, id };
}

async function resolveDocumentKind(
  id: string,
  hint?: "quote" | "invoice",
): Promise<"quote" | "invoice" | null> {
  const { token, organizationId } = await getApiContext();
  const order =
    hint === "invoice"
      ? (["invoices", "quotes"] as const)
      : hint === "quote"
        ? (["quotes", "invoices"] as const)
        : (["quotes", "invoices"] as const);

  for (const resource of order) {
    try {
      await laravelRequest(`/${resource}/${id}`, { token, organizationId });
      return resource === "quotes" ? "quote" : "invoice";
    } catch {
      // try next
    }
  }
  return null;
}

/** Convert an accepted quote into an invoice via Laravel. */
export async function convertQuote(
  quoteId: string,
): Promise<ActionResult> {
  if (isLaravelApiEnabled()) {
    try {
      const { token, organizationId } = await getApiContext();
      const invoice = await laravelRequest<{ id: string | number }>(
        `/quotes/${quoteId}/convert`,
        {
          method: "POST",
          token,
          organizationId,
          body: {},
        },
      );
      const invoiceId = String(invoice.id);
      revalidatePath("/quotes");
      revalidatePath("/invoices");
      revalidatePath("/dashboard");
      revalidatePath(`/quotes/${quoteId}`);
      revalidatePath(`/invoices/${invoiceId}`);
      return { ok: true, id: invoiceId };
    } catch (error) {
      return {
        ok: false,
        error: actionErrorMessage(error, "Conversion impossible"),
      };
    }
  }

  await verifySession();
  const store = await tenantStore();
  const quote = store.documents.find((d) => d.id === quoteId);
  if (!quote || quote.kind !== "quote") {
    return { ok: false, error: "Devis introuvable" };
  }
  const { convertQuoteToInvoice } = await import("@/lib/documents");
  const invoice = convertQuoteToInvoice(quote, store.documents);
  store.documents.unshift(invoice);
  const qIdx = store.documents.findIndex((d) => d.id === quoteId);
  if (qIdx >= 0) {
    store.documents[qIdx] = { ...quote, status: "converted" };
  }
  revalidateDocumentPaths(invoice.id);
  revalidatePath(`/quotes/${quoteId}`);
  return { ok: true, id: invoice.id };
}

export async function issueDocument(id: string): Promise<ActionResult> {
  return sendDocument(id);
}

export async function sendDocument(id: string): Promise<ActionResult> {
  if (isLaravelApiEnabled()) {
    try {
      const kind = await resolveDocumentKind(id);
      if (!kind) return { ok: false, error: "Document introuvable" };
      const { token, organizationId } = await getApiContext();
      const statut = kind === "quote" ? "envoye" : "envoyee";
      await laravelRequest(`/${kind === "quote" ? "quotes" : "invoices"}/${id}/status`, {
        method: "PUT",
        token,
        organizationId,
        body: { statut },
      });
      revalidateDocumentPaths(id);
      return { ok: true, id };
    } catch (error) {
      return { ok: false, error: actionErrorMessage(error, "Envoi impossible") };
    }
  }
  return mockIssueDocument(id);
}

export async function updateQuoteStatus(
  id: string,
  status: "accepted" | "refused" | "expired",
): Promise<ActionResult> {
  return updateDocumentStatus(id, status);
}

export async function updateDocumentStatus(
  id: string,
  status: "accepted" | "refused" | "expired" | "cancelled" | "applied",
): Promise<ActionResult> {
  if (isLaravelApiEnabled()) {
    try {
      const kind = await resolveDocumentKind(id);
      if (!kind) return { ok: false, error: "Document introuvable" };
      const { token, organizationId } = await getApiContext();
      const statut =
        kind === "quote"
          ? quoteStatusToApi(status)
          : invoiceStatusToApi(status);
      await laravelRequest(
        `/${kind === "quote" ? "quotes" : "invoices"}/${id}/status`,
        {
          method: "PUT",
          token,
          organizationId,
          body: { statut },
        },
      );
      revalidateDocumentPaths(id);
      return { ok: true, id };
    } catch (error) {
      return {
        ok: false,
        error: actionErrorMessage(error, "Mise à jour du statut impossible"),
      };
    }
  }

  await verifySession();
  const store = await tenantStore();
  const idx = store.documents.findIndex((d) => d.id === id);
  if (idx < 0) return { ok: false, error: "Document introuvable" };
  const doc = store.documents[idx];

  if (status === "cancelled") {
    if (doc.kind !== "invoice") return { ok: false, error: "Seules les factures peuvent être annulées" };
    if (!["sent", "partially_paid", "overdue"].includes(doc.status)) {
      return { ok: false, error: "Cette facture ne peut pas être annulée" };
    }
  } else if (status === "applied") {
    if (doc.kind !== "credit_note") return { ok: false, error: "Seuls les avoirs peuvent être appliqués" };
    if (doc.status !== "issued") {
      return { ok: false, error: "L’avoir doit être émis avant d’être appliqué" };
    }
  } else {
    if (doc.kind !== "quote") return { ok: false, error: "Devis introuvable" };
    if (!["sent", "accepted", "refused", "expired"].includes(doc.status)) {
      return { ok: false, error: "Le devis doit être émis avant de changer de statut" };
    }
  }

  store.documents[idx] = { ...doc, status };
  revalidateDocumentPaths(id);
  return { ok: true, id };
}

function revalidateDocumentPaths(id: string) {
  revalidatePath("/invoices");
  revalidatePath("/quotes");
  revalidatePath("/dashboard");
  revalidatePath(`/invoices/${id}`);
  revalidatePath(`/quotes/${id}`);
}

async function mockIssueDocument(id: string): Promise<ActionResult> {
  const store = await tenantStore();
  const idx = store.documents.findIndex((d) => d.id === id);
  if (idx < 0) return { ok: false, error: "Document introuvable" };
  const doc = store.documents[idx];
  store.documents[idx] = {
    ...doc,
    status: (doc.kind === "credit_note" ? "issued" : "sent") as BusinessDocument["status"],
    frozen: true,
  };
  revalidateDocumentPaths(id);
  return { ok: true, id };
}

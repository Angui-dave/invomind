"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifySession } from "@/lib/dal/session";
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
  quantity: z.number(),
  unitPrice: z.number(),
  taxRate: z.number(),
  discountPercent: z.number().optional(),
  catalogItemId: z.string().optional(),
  unit: z.string().optional(),
});

const DocumentInputSchema = z.object({
  kind: z.enum(["quote", "invoice", "credit_note"]),
  clientId: z.string().min(1),
  status: z.string(),
  currency: z.string(),
  taxMode: z.enum(["inclusive", "exclusive"]),
  issueDate: z.string(),
  dueDate: z.string(),
  lines: z.array(LineSchema).min(1),
  onlinePaymentEnabled: z.boolean().default(false),
  remindersEnabled: z.boolean().default(true),
  notes: z.string().optional(),
  sourceDocumentId: z.string().optional(),
  paymentMethod: z.string().nullable().optional(),
});

export async function saveDocument(
  id: string | null,
  input: z.infer<typeof DocumentInputSchema>,
): Promise<ActionResult> {
  const session = await verifySession();
  const parsed = DocumentInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Document invalide" };
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
    catalogItemId: l.catalogItemId,
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
      sourceDocumentId: data.sourceDocumentId,
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
      sourceDocumentId: data.sourceDocumentId,
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

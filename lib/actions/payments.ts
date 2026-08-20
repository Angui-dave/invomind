"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { actionErrorMessage } from "@/lib/laravel/action-errors";
import { getApiContext } from "@/lib/laravel/context";
import { tenantStore } from "@/lib/mock/store";
import { todayIso } from "@/lib/date";
import type { Payment } from "@/lib/data/payments";
import type { CurrencyCode } from "@/lib/money";
import type { PaymentMethod } from "@/lib/documents";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

const PaymentSchema = z.object({
  documentId: z.string().min(1),
  amount: z.number().positive(),
  method: z.string(),
  paidAt: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function createPayment(
  input: z.infer<typeof PaymentSchema>,
): Promise<ActionResult> {
  if (isLaravelApiEnabled()) {
    const parsed = PaymentSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Paiement invalide" };
    try {
      const { token, organizationId } = await getApiContext();
      const created = await laravelRequest<{ id: string }>("/payments", {
        method: "POST",
        token,
        organizationId,
        body: {
          document_id: parsed.data.documentId,
          amount: parsed.data.amount,
          method: parsed.data.method,
          paid_at: parsed.data.paidAt ?? todayIso(),
          reference: parsed.data.reference,
          notes: parsed.data.notes,
        },
      });
      revalidatePath("/payments");
      revalidatePath("/invoices");
      revalidatePath("/dashboard");
      return { ok: true, id: created.id };
    } catch (error) {
      return {
        ok: false,
        error: actionErrorMessage(error, "Paiement invalide"),
      };
    }
  }
  await verifySession();
  const parsed = PaymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Paiement invalide" };

  const store = await tenantStore();
  const doc = store.documents.find((d) => d.id === parsed.data.documentId);
  if (!doc) return { ok: false, error: "Facture introuvable" };

  const id = `pay_${Math.random().toString(36).slice(2, 8)}`;
  const payment: Payment = {
    id,
    documentId: doc.id,
    documentNumber: doc.number,
    clientId: doc.clientId,
    clientName: doc.clientName,
    amount: parsed.data.amount,
    currency: doc.currency as CurrencyCode,
    method: parsed.data.method as PaymentMethod,
    paidAt: parsed.data.paidAt ?? todayIso(),
    reference: parsed.data.reference,
    notes: parsed.data.notes,
  };
  store.payments.unshift(payment);

  revalidatePath("/payments");
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  revalidatePath(`/invoices/${doc.id}`);
  return { ok: true, id };
}

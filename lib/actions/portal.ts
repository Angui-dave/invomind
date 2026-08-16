"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  findTenantIdByPortalToken,
  tenantStoreById,
} from "@/lib/mock/store";
import { todayIso } from "@/lib/date";
import type { Payment } from "@/lib/data/payments";
import type { CurrencyCode } from "@/lib/money";
import type { PaymentMethod } from "@/lib/documents";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

const PortalPaymentSchema = z.object({
  token: z.string().min(4),
  method: z.string(),
  amount: z.number().positive(),
});

export async function recordPortalPayment(
  input: z.infer<typeof PortalPaymentSchema>,
): Promise<ActionResult> {
  const parsed = PortalPaymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Paiement invalide" };

  const tenantId = findTenantIdByPortalToken(parsed.data.token);
  if (!tenantId) return { ok: false, error: "Facture introuvable" };

  const store = tenantStoreById(tenantId);
  const doc = store.documents.find(
    (d) => d.portalToken === parsed.data.token && d.kind === "invoice",
  );
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
    paidAt: todayIso(),
    reference: `portal-${Date.now()}`,
  };
  store.payments.unshift(payment);

  const idx = store.documents.findIndex((d) => d.id === doc.id);
  if (idx >= 0) {
    store.documents[idx] = {
      ...store.documents[idx],
      paidOnlineAt: todayIso(),
      paymentMethod: parsed.data.method as PaymentMethod,
    };
  }

  revalidatePath(`/f/${parsed.data.token}`);
  return { ok: true, id };
}

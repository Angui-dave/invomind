import "server-only";
import { verifySession } from "@/lib/dal/session";
import { tenantStore } from "@/lib/mock/store";
import type { Payment } from "@/lib/data/payments";

export async function listPayments(): Promise<Payment[]> {
  await verifySession();
  const store = await tenantStore();
  return [...store.payments].sort((a, b) =>
    b.paidAt.localeCompare(a.paidAt),
  );
}

export async function listPaymentsForDocument(
  documentId: string,
): Promise<Payment[]> {
  await verifySession();
  const store = await tenantStore();
  return store.payments.filter((p) => p.documentId === documentId);
}

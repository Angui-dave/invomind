import "server-only";
import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { mapPayment } from "@/lib/laravel/mappers";
import { tenantStore } from "@/lib/mock/store";
import type { Payment } from "@/lib/data/payments";

export async function listPayments(): Promise<Payment[]> {
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    const token = (await readSessionCookie())?.accessToken;
    const rows = await laravelRequest<unknown[]>("/payments", {
      token,
      organizationId: session.organizationId,
    });
    return rows.map(mapPayment).sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  }
  const store = await tenantStore();
  return [...store.payments].sort((a, b) =>
    b.paidAt.localeCompare(a.paidAt),
  );
}

export async function listPaymentsForDocument(
  documentId: string,
): Promise<Payment[]> {
  await verifySession();
  if (isLaravelApiEnabled()) {
    const rows = await listPayments();
    return rows.filter((p) => p.documentId === documentId);
  }
  const store = await tenantStore();
  return store.payments.filter((p) => p.documentId === documentId);
}

import "server-only";
import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { getInvoices, listClients } from "@/lib/dal/documents";
import { laravelRequest } from "@/lib/laravel/client";
import { unwrapList } from "@/lib/laravel/pagination";
import { mapPayment } from "@/lib/laravel/mappers";
import { tenantStore } from "@/lib/mock/store";
import type { Payment } from "@/lib/data/payments";

export async function listPayments(): Promise<Payment[]> {
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    const token = (await readSessionCookie())?.accessToken;
    const [rows, invoices, clients] = await Promise.all([
      unwrapList(
        await laravelRequest<unknown>("/payments", {
          token,
          organizationId: session.organizationId,
        }),
      ),
      getInvoices(),
      listClients(),
    ]);
    const invById = new Map(invoices.map((d) => [d.id, d]));
    const clientById = new Map(clients.map((c) => [c.id, c]));
    return rows
      .map((row) => {
        const payment = mapPayment(row);
        const inv = invById.get(payment.documentId);
        const client =
          clientById.get(payment.clientId) ??
          (inv ? clientById.get(inv.clientId) : undefined);
        return {
          ...payment,
          documentNumber: payment.documentNumber || inv?.number || "",
          clientId: payment.clientId || inv?.clientId || "",
          clientName:
            payment.clientName ||
            client?.name ||
            inv?.clientName ||
            "",
        };
      })
      .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
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
    try {
      const token = (await readSessionCookie())?.accessToken;
      const session = await verifySession();
      const rows = unwrapList(
        await laravelRequest<unknown>(
          `/payments?facture_id=${encodeURIComponent(documentId)}`,
          {
            token,
            organizationId: session.organizationId,
          },
        ),
      );
      return rows.map(mapPayment);
    } catch {
      const rows = await listPayments();
      return rows.filter((p) => p.documentId === documentId);
    }
  }
  const store = await tenantStore();
  return store.payments.filter((p) => p.documentId === documentId);
}

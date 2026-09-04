import "server-only";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { listClients, getInvoices, getQuotes } from "@/lib/dal/documents";
import { clientToProspect } from "@/lib/laravel/mappers";
import { tenantStore } from "@/lib/mock/store";
import type { Prospect } from "@/lib/data/settings";
import { activeProspectsValue as calc } from "@/lib/data/settings";

/**
 * Pipeline cards are clients grouped by `categorie_client`.
 * Estimated value ≈ open quotes + unpaid invoices for that client.
 */
export async function listProspects(): Promise<Prospect[]> {
  await verifySession();
  if (isLaravelApiEnabled()) {
    const [clients, invoices, quotes] = await Promise.all([
      listClients(),
      getInvoices(),
      getQuotes(),
    ]);

    return clients.map((client) => {
      const openDocs = [...quotes, ...invoices].filter(
        (d) =>
          d.clientId === client.id &&
          d.status !== "cancelled" &&
          d.status !== "refused" &&
          d.status !== "expired" &&
          d.status !== "paid" &&
          d.status !== "converted",
      );
      const estimatedValue = openDocs.reduce((sum, d) => sum + d.total, 0);
      return clientToProspect(client, estimatedValue);
    });
  }
  const store = await tenantStore();
  return [...store.prospects];
}

export async function activeProspectsValue(): Promise<{
  total: number;
  count: number;
}> {
  await verifySession();
  if (isLaravelApiEnabled()) {
    const prospects = await listProspects();
    return calc(prospects);
  }
  const store = await tenantStore();
  return calc(store.prospects);
}

import "server-only";
import { verifySession } from "@/lib/dal/session";
import { tenantStore } from "@/lib/mock/store";
import type { Supplier } from "@/lib/data/suppliers";

export async function listSuppliers(): Promise<Supplier[]> {
  await verifySession();
  const store = await tenantStore();
  return [...store.suppliers];
}

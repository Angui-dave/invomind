import "server-only";
import { verifySession } from "@/lib/dal/session";
import { tenantStore } from "@/lib/mock/store";
import type { CatalogItem } from "@/lib/data/catalog";

export async function listCatalogItems(): Promise<CatalogItem[]> {
  await verifySession();
  const store = await tenantStore();
  return [...store.catalogItems];
}

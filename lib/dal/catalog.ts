import "server-only";
import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { mapCatalogItem } from "@/lib/laravel/mappers";
import { tenantStore } from "@/lib/mock/store";
import type { CatalogItem } from "@/lib/data/catalog";

export async function listCatalogItems(): Promise<CatalogItem[]> {
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    const token = (await readSessionCookie())?.accessToken;
    const rows = await laravelRequest<unknown[]>("/catalog", {
      token,
      organizationId: session.organizationId,
    });
    return rows.map(mapCatalogItem);
  }
  const store = await tenantStore();
  return [...store.catalogItems];
}

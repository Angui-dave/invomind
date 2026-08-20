import "server-only";
import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { unwrapList } from "@/lib/laravel/pagination";
import { mapSupplier } from "@/lib/laravel/mappers";
import { tenantStore } from "@/lib/mock/store";
import type { Supplier } from "@/lib/data/suppliers";

export async function listSuppliers(): Promise<Supplier[]> {
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    const token = (await readSessionCookie())?.accessToken;
    const rows = unwrapList(
      await laravelRequest<unknown>("/suppliers", {
        token,
        organizationId: session.organizationId,
      }),
    );
    return rows.map(mapSupplier);
  }
  const store = await tenantStore();
  return [...store.suppliers];
}

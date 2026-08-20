import "server-only";
import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { unwrapList } from "@/lib/laravel/pagination";
import { mapProspect } from "@/lib/laravel/mappers";
import { tenantStore } from "@/lib/mock/store";
import type { Prospect } from "@/lib/data/settings";
import { activeProspectsValue as calc } from "@/lib/data/settings";

export async function listProspects(): Promise<Prospect[]> {
  const session = await verifySession();
  if (isLaravelApiEnabled()) {
    const token = (await readSessionCookie())?.accessToken;
    const rows = unwrapList(
      await laravelRequest<unknown>("/prospects", {
        token,
        organizationId: session.organizationId,
      }),
    );
    return rows.map(mapProspect);
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

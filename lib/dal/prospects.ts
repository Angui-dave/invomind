import "server-only";
import { verifySession } from "@/lib/dal/session";
import { tenantStore } from "@/lib/mock/store";
import type { Prospect } from "@/lib/data/settings";
import { activeProspectsValue as calc } from "@/lib/data/settings";

export async function listProspects(): Promise<Prospect[]> {
  await verifySession();
  const store = await tenantStore();
  return [...store.prospects];
}

export async function activeProspectsValue(): Promise<{
  total: number;
  count: number;
}> {
  await verifySession();
  const store = await tenantStore();
  return calc(store.prospects);
}

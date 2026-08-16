"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifySession } from "@/lib/dal/session";
import { assertCanCreateClient } from "@/lib/billing/entitlements";
import { opaquePortalToken } from "@/lib/documents";
import { tenantStore } from "@/lib/mock/store";
import type { Client } from "@/lib/data/clients";
import type { CurrencyCode } from "@/lib/money";

const ClientSchema = z.object({
  name: z.string().min(1),
  company: z.string().default(""),
  email: z.email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string().optional(),
  paymentTermDays: z.coerce.number().optional(),
  remindersEnabled: z.coerce.boolean().default(true),
});

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export async function createClient(
  input: z.infer<typeof ClientSchema>,
): Promise<ActionResult> {
  const session = await verifySession();
  const parsed = ClientSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Données client invalides" };
  }

  try {
    await assertCanCreateClient(
      session.organizationId,
      session.organization.planId,
    );
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Limite atteinte",
    };
  }

  const id = `cli_${Math.random().toString(36).slice(2, 8)}`;
  const client: Client = {
    id,
    name: parsed.data.name,
    company: parsed.data.company,
    email: parsed.data.email,
    phone: parsed.data.phone,
    address: parsed.data.address,
    city: parsed.data.city,
    postalCode: parsed.data.postalCode,
    country: parsed.data.country,
    taxId: parsed.data.taxId,
    currency: parsed.data.currency as CurrencyCode | undefined,
    paymentTermDays: parsed.data.paymentTermDays,
    remindersEnabled: parsed.data.remindersEnabled,
    portalToken: `cli-${opaquePortalToken().slice(0, 12)}`,
  };

  (await tenantStore()).clients.unshift(client);
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { ok: true, id };
}

export async function updateClient(
  id: string,
  input: z.infer<typeof ClientSchema>,
): Promise<ActionResult> {
  await verifySession();
  const parsed = ClientSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Données client invalides" };
  }

  const store = await tenantStore();
  const idx = store.clients.findIndex((c) => c.id === id);
  if (idx < 0) return { ok: false, error: "Client introuvable" };

  store.clients[idx] = {
    ...store.clients[idx],
    ...parsed.data,
    currency: parsed.data.currency as CurrencyCode | undefined,
  };

  revalidatePath("/clients");
  return { ok: true, id };
}

export async function deleteClient(id: string): Promise<ActionResult> {
  await verifySession();
  const store = await tenantStore();
  const linked = store.documents.some((d) => d.clientId === id);
  if (linked) {
    return {
      ok: false,
      error: "Impossible de supprimer ce client (documents liés).",
    };
  }
  store.clients = store.clients.filter((c) => c.id !== id);
  revalidatePath("/clients");
  return { ok: true };
}

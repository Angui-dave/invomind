"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { actionErrorMessage } from "@/lib/laravel/action-errors";
import { getApiContext } from "@/lib/laravel/context";
import { toLaravelClientBody } from "@/lib/laravel/payloads";
import { assertCanCreateClient } from "@/lib/billing/entitlements";
import { opaquePortalToken } from "@/lib/documents";
import { tenantStore } from "@/lib/mock/store";
import type { Client } from "@/lib/data/clients";
import type { CurrencyCode } from "@/lib/money";
import type { PipelineStage } from "@/lib/data/settings";

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
  categorieClient: z
    .enum(["prospect", "qualifie", "negociation", "client", "inactif"])
    .optional(),
  notes: z.string().optional().nullable(),
});

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export async function createClient(
  input: z.infer<typeof ClientSchema>,
): Promise<ActionResult> {
  if (isLaravelApiEnabled()) {
    const parsed = ClientSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Données client invalides" };
    try {
      const { token, organizationId } = await getApiContext();
      const created = await laravelRequest<{ id: string | number }>("/clients", {
        method: "POST",
        token,
        organizationId,
        body: toLaravelClientBody({
          ...parsed.data,
          notes: parsed.data.notes ?? null,
        }),
      });
      revalidatePath("/clients");
      revalidatePath("/dashboard");
      return { ok: true, id: String(created.id) };
    } catch (error) {
      return {
        ok: false,
        error: actionErrorMessage(error, "Création impossible"),
      };
    }
  }
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
    categorieClient: parsed.data.categorieClient as PipelineStage | undefined,
    notes: parsed.data.notes ?? undefined,
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
  if (isLaravelApiEnabled()) {
    const parsed = ClientSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Données client invalides" };
    try {
      const { token, organizationId } = await getApiContext();
      await laravelRequest(`/clients/${id}`, {
        method: "PUT",
        token,
        organizationId,
        body: toLaravelClientBody({
          ...parsed.data,
          notes: parsed.data.notes ?? null,
        }),
      });
      revalidatePath("/clients");
      return { ok: true, id };
    } catch (error) {
      return {
        ok: false,
        error: actionErrorMessage(error, "Mise à jour impossible"),
      };
    }
  }
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
    categorieClient: parsed.data.categorieClient as PipelineStage | undefined,
    notes: parsed.data.notes ?? undefined,
  };

  revalidatePath("/clients");
  return { ok: true, id };
}

export async function updateClientCategory(
  id: string,
  categorieClient: PipelineStage,
): Promise<ActionResult> {
  if (isLaravelApiEnabled()) {
    try {
      const { token, organizationId } = await getApiContext();
      const existing = await laravelRequest<Record<string, unknown>>(
        `/clients/${id}`,
        { token, organizationId },
      );
      await laravelRequest(`/clients/${id}`, {
        method: "PUT",
        token,
        organizationId,
        body: {
          name_company: existing.name_company,
          email: existing.email ?? null,
          phone: existing.phone ?? null,
          adresse: existing.adresse ?? null,
          ville: existing.ville ?? null,
          code_postal: existing.code_postal ?? null,
          country: existing.country ?? null,
          devise: existing.devise ?? "XOF",
          notes: existing.notes ?? null,
          categorie_client: categorieClient,
        },
      });
      revalidatePath("/clients");
      revalidatePath("/dashboard");
      return { ok: true, id };
    } catch (error) {
      return {
        ok: false,
        error: actionErrorMessage(error, "Mise à jour impossible"),
      };
    }
  }
  await verifySession();
  const store = await tenantStore();
  const idx = store.clients.findIndex((c) => c.id === id);
  if (idx < 0) return { ok: false, error: "Client introuvable" };
  store.clients[idx] = { ...store.clients[idx], categorieClient };
  revalidatePath("/clients");
  return { ok: true, id };
}

export async function deleteClient(id: string): Promise<ActionResult> {
  if (isLaravelApiEnabled()) {
    try {
      const { token, organizationId } = await getApiContext();
      await laravelRequest(`/clients/${id}`, {
        method: "DELETE",
        token,
        organizationId,
      });
      revalidatePath("/clients");
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: actionErrorMessage(error, "Suppression impossible"),
      };
    }
  }
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

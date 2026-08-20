"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { actionErrorMessage } from "@/lib/laravel/action-errors";
import { getApiContext } from "@/lib/laravel/context";
import { tenantStore } from "@/lib/mock/store";
import type { CatalogItem } from "@/lib/data/catalog";
import type { CurrencyCode } from "@/lib/money";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

const CatalogItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  unitPrice: z.number().min(0),
  currency: z.string().default("XOF"),
  taxRate: z.number().min(0).default(0),
  unit: z.string().default("unité"),
  kind: z.enum(["service", "product"]).default("service"),
});

export async function createCatalogItem(
  input: z.infer<typeof CatalogItemSchema>,
): Promise<ActionResult> {
  if (isLaravelApiEnabled()) {
    const parsed = CatalogItemSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Article catalogue invalide" };
    try {
      const { token, organizationId } = await getApiContext();
      const created = await laravelRequest<{ id: string }>("/catalog", {
        method: "POST",
        token,
        organizationId,
        body: {
          name: parsed.data.name,
          description: parsed.data.description,
          unit_price: parsed.data.unitPrice,
          currency: parsed.data.currency,
          tax_rate: parsed.data.taxRate,
          unit: parsed.data.unit,
          kind: parsed.data.kind,
        },
      });
      revalidatePath("/catalog");
      revalidatePath("/invoices/new");
      revalidatePath("/quotes/new");
      return { ok: true, id: created.id };
    } catch (error) {
      return {
        ok: false,
        error: actionErrorMessage(error, "Article catalogue invalide"),
      };
    }
  }
  await verifySession();
  const parsed = CatalogItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Article catalogue invalide" };
  }

  const id = `cat_item_${Math.random().toString(36).slice(2, 8)}`;
  const item: CatalogItem = {
    id,
    name: parsed.data.name,
    description: parsed.data.description,
    unitPrice: parsed.data.unitPrice,
    currency: parsed.data.currency as CurrencyCode,
    taxRate: parsed.data.taxRate,
    unit: parsed.data.unit,
    kind: parsed.data.kind,
  };

  (await tenantStore()).catalogItems.unshift(item);

  revalidatePath("/catalog");
  revalidatePath("/invoices/new");
  revalidatePath("/quotes/new");
  return { ok: true, id };
}

export async function updateCatalogItem(
  id: string,
  input: z.infer<typeof CatalogItemSchema>,
): Promise<ActionResult> {
  if (isLaravelApiEnabled()) {
    const parsed = CatalogItemSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Article catalogue invalide" };
    try {
      const { token, organizationId } = await getApiContext();
      await laravelRequest(`/catalog/${id}`, {
        method: "PUT",
        token,
        organizationId,
        body: {
          name: parsed.data.name,
          description: parsed.data.description,
          unit_price: parsed.data.unitPrice,
          currency: parsed.data.currency,
          tax_rate: parsed.data.taxRate,
          unit: parsed.data.unit,
          kind: parsed.data.kind,
        },
      });
      revalidatePath("/catalog");
      return { ok: true, id };
    } catch (error) {
      return {
        ok: false,
        error: actionErrorMessage(error, "Article catalogue invalide"),
      };
    }
  }
  await verifySession();
  const parsed = CatalogItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Article catalogue invalide" };
  }

  const store = await tenantStore();
  const idx = store.catalogItems.findIndex((c) => c.id === id);
  if (idx < 0) return { ok: false, error: "Article introuvable" };

  store.catalogItems[idx] = {
    ...store.catalogItems[idx],
    name: parsed.data.name,
    description: parsed.data.description,
    unitPrice: parsed.data.unitPrice,
    currency: parsed.data.currency as CurrencyCode,
    taxRate: parsed.data.taxRate,
    unit: parsed.data.unit,
    kind: parsed.data.kind,
  };

  revalidatePath("/catalog");
  return { ok: true, id };
}

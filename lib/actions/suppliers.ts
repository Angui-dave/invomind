"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { actionErrorMessage } from "@/lib/laravel/action-errors";
import { getApiContext } from "@/lib/laravel/context";
import { toLaravelSupplierBody } from "@/lib/laravel/supplier-payloads";
import { tenantStore } from "@/lib/mock/store";
import type { Supplier } from "@/lib/data/suppliers";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

const SupplierSchema = z.object({
  name: z.string().default(""),
  company: z.string().min(1),
  email: z.string().default(""),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function createSupplier(
  input: z.infer<typeof SupplierSchema>,
): Promise<ActionResult> {
  const parsed = SupplierSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Fournisseur invalide" };
  }

  if (isLaravelApiEnabled()) {
    try {
      const { token, organizationId } = await getApiContext();
      const created = await laravelRequest<{ id: string | number }>(
        "/suppliers",
        {
          method: "POST",
          token,
          organizationId,
          body: toLaravelSupplierBody(parsed.data),
        },
      );
      revalidatePath("/suppliers");
      revalidatePath("/expenses");
      return { ok: true, id: String(created.id) };
    } catch (e) {
      return { ok: false, error: actionErrorMessage(e, "Erreur fournisseur") };
    }
  }

  await verifySession();
  const id = `sup_${Math.random().toString(36).slice(2, 8)}`;
  const supplier: Supplier = {
    id,
    name: parsed.data.name,
    company: parsed.data.company,
    email: parsed.data.email,
    phone: parsed.data.phone ?? undefined,
    address: parsed.data.address ?? undefined,
    city: parsed.data.city ?? undefined,
    country: parsed.data.country ?? undefined,
    taxId: parsed.data.taxId ?? undefined,
    notes: parsed.data.notes ?? undefined,
  };

  (await tenantStore()).suppliers.unshift(supplier);

  revalidatePath("/suppliers");
  revalidatePath("/expenses");
  return { ok: true, id };
}

export async function updateSupplier(
  id: string,
  input: z.infer<typeof SupplierSchema>,
): Promise<ActionResult> {
  const parsed = SupplierSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Fournisseur invalide" };
  }

  if (isLaravelApiEnabled()) {
    try {
      const { token, organizationId } = await getApiContext();
      await laravelRequest(`/suppliers/${id}`, {
        method: "PUT",
        token,
        organizationId,
        body: toLaravelSupplierBody(parsed.data),
      });
      revalidatePath("/suppliers");
      revalidatePath("/expenses");
      return { ok: true, id };
    } catch (e) {
      return { ok: false, error: actionErrorMessage(e, "Erreur fournisseur") };
    }
  }

  await verifySession();
  const store = await tenantStore();
  const idx = store.suppliers.findIndex((s) => s.id === id);
  if (idx < 0) return { ok: false, error: "Fournisseur introuvable" };

  store.suppliers[idx] = {
    ...store.suppliers[idx],
    name: parsed.data.name,
    company: parsed.data.company,
    email: parsed.data.email,
    phone: parsed.data.phone ?? undefined,
    address: parsed.data.address ?? undefined,
    city: parsed.data.city ?? undefined,
    country: parsed.data.country ?? undefined,
    taxId: parsed.data.taxId ?? undefined,
    notes: parsed.data.notes ?? undefined,
  };

  revalidatePath("/suppliers");
  revalidatePath("/expenses");
  return { ok: true, id };
}

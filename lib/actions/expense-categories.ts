"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { actionErrorMessage } from "@/lib/laravel/action-errors";
import { getApiContext } from "@/lib/laravel/context";
import { tenantStore } from "@/lib/mock/store";
import type { ExpenseCategory } from "@/lib/data/expenses";

export type ActionResult =
  | { ok: true; id?: string; category?: ExpenseCategory }
  | { ok: false; error: string };

const CategorySchema = z.object({
  name: z.string().min(1).max(100),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
  description: z.string().optional().nullable(),
});

export async function createExpenseCategory(
  input: z.infer<typeof CategorySchema>,
): Promise<ActionResult> {
  const parsed = CategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Catégorie invalide" };
  }

  if (isLaravelApiEnabled()) {
    try {
      const { token, organizationId } = await getApiContext();
      const created = await laravelRequest<{
        id: string | number;
        nom?: string;
        couleur?: string | null;
      }>("/expense-categories", {
        method: "POST",
        token,
        organizationId,
        body: {
          nom: parsed.data.name,
          couleur: parsed.data.color ?? null,
          description: parsed.data.description ?? null,
        },
      });
      revalidatePath("/expenses");
      return {
        ok: true,
        id: String(created.id),
        category: {
          id: String(created.id),
          name: created.nom ?? parsed.data.name,
          color: created.couleur ?? parsed.data.color ?? "#888888",
        },
      };
    } catch (e) {
      return { ok: false, error: actionErrorMessage(e, "Erreur catégorie") };
    }
  }

  await verifySession();
  const id = `cat_${Math.random().toString(36).slice(2, 8)}`;
  const category: ExpenseCategory = {
    id,
    name: parsed.data.name,
    color: parsed.data.color ?? "#888888",
  };
  (await tenantStore()).expenseCategories.push(category);
  revalidatePath("/expenses");
  return { ok: true, id, category };
}

export async function updateExpenseCategory(
  id: string,
  input: z.infer<typeof CategorySchema>,
): Promise<ActionResult> {
  const parsed = CategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Catégorie invalide" };
  }

  if (isLaravelApiEnabled()) {
    try {
      const { token, organizationId } = await getApiContext();
      await laravelRequest(`/expense-categories/${id}`, {
        method: "PUT",
        token,
        organizationId,
        body: {
          nom: parsed.data.name,
          couleur: parsed.data.color ?? null,
          description: parsed.data.description ?? null,
        },
      });
      revalidatePath("/expenses");
      return {
        ok: true,
        id,
        category: {
          id,
          name: parsed.data.name,
          color: parsed.data.color ?? "#888888",
        },
      };
    } catch (e) {
      return { ok: false, error: actionErrorMessage(e, "Erreur catégorie") };
    }
  }

  await verifySession();
  const store = await tenantStore();
  const idx = store.expenseCategories.findIndex((c) => c.id === id);
  if (idx < 0) return { ok: false, error: "Catégorie introuvable" };
  store.expenseCategories[idx] = {
    ...store.expenseCategories[idx],
    name: parsed.data.name,
    color: parsed.data.color ?? store.expenseCategories[idx].color,
  };
  revalidatePath("/expenses");
  return {
    ok: true,
    id,
    category: store.expenseCategories[idx],
  };
}

export async function deactivateExpenseCategory(
  id: string,
): Promise<ActionResult> {
  if (isLaravelApiEnabled()) {
    try {
      const { token, organizationId } = await getApiContext();
      await laravelRequest(`/expense-categories/${id}`, {
        method: "DELETE",
        token,
        organizationId,
      });
      revalidatePath("/expenses");
      return { ok: true, id };
    } catch (e) {
      return { ok: false, error: actionErrorMessage(e, "Erreur catégorie") };
    }
  }

  await verifySession();
  const store = await tenantStore();
  const idx = store.expenseCategories.findIndex((c) => c.id === id);
  if (idx < 0) return { ok: false, error: "Catégorie introuvable" };
  store.expenseCategories.splice(idx, 1);
  revalidatePath("/expenses");
  return { ok: true, id };
}

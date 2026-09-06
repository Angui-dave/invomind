"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { actionErrorMessage } from "@/lib/laravel/action-errors";
import { getApiContext } from "@/lib/laravel/context";
import { toLaravelExpenseBody } from "@/lib/laravel/payloads";
import { tenantStore } from "@/lib/mock/store";
import type { Expense } from "@/lib/data/expenses";
import type { CurrencyCode } from "@/lib/money";
import { calculateVat } from "@/lib/tax";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

const ExpenseSchema = z.object({
  date: z.string().min(1),
  description: z.string().min(1),
  /** Montant TTC saisi dans l'UI. */
  amount: z.number().positive(),
  currency: z.string().default("XOF"),
  categoryId: z.string().min(1),
  supplierId: z.string().optional().nullable(),
  supplierName: z.string().optional().nullable(),
  taxRate: z.number().min(0).default(0),
  taxDeductible: z.boolean().default(true),
  taxAmount: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
});

async function resolveSupplierName(
  supplierId: string | null | undefined,
  supplierName: string | null | undefined,
): Promise<string | undefined> {
  if (supplierName) return supplierName;
  if (!supplierId) return undefined;
  if (isLaravelApiEnabled()) return undefined;
  const sup = (await tenantStore()).suppliers.find((s) => s.id === supplierId);
  return sup?.company || sup?.name || undefined;
}

function toHtAmount(ttc: number, taxRate: number): number {
  return calculateVat(ttc, taxRate, "inclusive").ht;
}

export async function createExpense(
  input: z.infer<typeof ExpenseSchema>,
): Promise<ActionResult> {
  if (isLaravelApiEnabled()) {
    const parsed = ExpenseSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Dépense invalide" };
    try {
      const { token, organizationId } = await getApiContext();
      const created = await laravelRequest<{ id: string | number }>("/expenses", {
        method: "POST",
        token,
        organizationId,
        body: toLaravelExpenseBody({
          date: parsed.data.date,
          description: parsed.data.description,
          amount: toHtAmount(parsed.data.amount, parsed.data.taxRate),
          currency: parsed.data.currency,
          categoryId: parsed.data.categoryId,
          supplierId: parsed.data.supplierId,
          supplierName: parsed.data.supplierName,
          taxRate: parsed.data.taxRate,
          notes: parsed.data.notes,
          paymentMethod: parsed.data.paymentMethod,
        }),
      });
      revalidatePath("/expenses");
      revalidatePath("/reports");
      revalidatePath("/dashboard");
      return { ok: true, id: String(created.id) };
    } catch (e) {
      return { ok: false, error: actionErrorMessage(e, "Erreur dépense") };
    }
  }
  await verifySession();
  const parsed = ExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Dépense invalide" };
  }

  try {
    const id = `exp_${Math.random().toString(36).slice(2, 8)}`;
    const vat = calculateVat(
      parsed.data.amount,
      parsed.data.taxRate,
      "inclusive",
    );
    const expense: Expense = {
      id,
      date: parsed.data.date,
      description: parsed.data.description,
      amountHt: vat.ht,
      amountTtc: parsed.data.amount,
      currency: parsed.data.currency as CurrencyCode,
      categoryId: parsed.data.categoryId,
      supplierId: parsed.data.supplierId ?? undefined,
      supplierName: await resolveSupplierName(
        parsed.data.supplierId,
        parsed.data.supplierName,
      ),
      taxRate: parsed.data.taxRate,
      taxDeductible: parsed.data.taxDeductible,
      taxAmount: parsed.data.taxDeductible ? vat.vat : 0,
      notes: parsed.data.notes ?? undefined,
      paymentMethod: parsed.data.paymentMethod ?? undefined,
      statut: "validee",
    };

    (await tenantStore()).expenses.unshift(expense);

    revalidatePath("/expenses");
    revalidatePath("/reports");
    revalidatePath("/dashboard");
    return { ok: true, id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur dépense",
    };
  }
}

export async function updateExpense(
  id: string,
  input: z.infer<typeof ExpenseSchema>,
): Promise<ActionResult> {
  if (isLaravelApiEnabled()) {
    const parsed = ExpenseSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Dépense invalide" };
    try {
      const { token, organizationId } = await getApiContext();
      await laravelRequest(`/expenses/${id}`, {
        method: "PUT",
        token,
        organizationId,
        body: toLaravelExpenseBody({
          date: parsed.data.date,
          description: parsed.data.description,
          amount: toHtAmount(parsed.data.amount, parsed.data.taxRate),
          currency: parsed.data.currency,
          categoryId: parsed.data.categoryId,
          supplierId: parsed.data.supplierId,
          supplierName: parsed.data.supplierName,
          taxRate: parsed.data.taxRate,
          notes: parsed.data.notes,
          paymentMethod: parsed.data.paymentMethod,
        }),
      });
      revalidatePath("/expenses");
      revalidatePath("/reports");
      return { ok: true, id };
    } catch (e) {
      return { ok: false, error: actionErrorMessage(e, "Erreur dépense") };
    }
  }
  await verifySession();
  const parsed = ExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Dépense invalide" };
  }

  try {
    const store = await tenantStore();
    const idx = store.expenses.findIndex((e) => e.id === id);
    if (idx < 0) return { ok: false, error: "Dépense introuvable" };

    const vat = calculateVat(
      parsed.data.amount,
      parsed.data.taxRate,
      "inclusive",
    );
    store.expenses[idx] = {
      ...store.expenses[idx],
      date: parsed.data.date,
      description: parsed.data.description,
      amountHt: vat.ht,
      amountTtc: parsed.data.amount,
      currency: parsed.data.currency as CurrencyCode,
      categoryId: parsed.data.categoryId,
      supplierId: parsed.data.supplierId ?? undefined,
      supplierName: await resolveSupplierName(
        parsed.data.supplierId,
        parsed.data.supplierName,
      ),
      taxRate: parsed.data.taxRate,
      taxDeductible: parsed.data.taxDeductible,
      taxAmount: parsed.data.taxDeductible ? vat.vat : 0,
      notes: parsed.data.notes ?? undefined,
      paymentMethod: parsed.data.paymentMethod ?? undefined,
    };

    revalidatePath("/expenses");
    revalidatePath("/reports");
    return { ok: true, id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur dépense",
    };
  }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  if (isLaravelApiEnabled()) {
    try {
      const { token, organizationId } = await getApiContext();
      await laravelRequest(`/expenses/${id}`, {
        method: "DELETE",
        token,
        organizationId,
      });
      revalidatePath("/expenses");
      revalidatePath("/reports");
      revalidatePath("/dashboard");
      return { ok: true, id };
    } catch (e) {
      return { ok: false, error: actionErrorMessage(e, "Erreur dépense") };
    }
  }

  await verifySession();
  const store = await tenantStore();
  const idx = store.expenses.findIndex((e) => e.id === id);
  if (idx < 0) return { ok: false, error: "Dépense introuvable" };
  store.expenses.splice(idx, 1);
  revalidatePath("/expenses");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return { ok: true, id };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifySession } from "@/lib/dal/session";
import { tenantStore } from "@/lib/mock/store";
import type { Expense } from "@/lib/data/expenses";
import type { CurrencyCode } from "@/lib/money";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

const ExpenseSchema = z.object({
  date: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default("XOF"),
  categoryId: z.string().min(1),
  supplierId: z.string().optional().nullable(),
  supplierName: z.string().optional().nullable(),
  taxRate: z.number().min(0).default(0),
  taxDeductible: z.boolean().default(true),
  taxAmount: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
});

async function resolveSupplierName(
  supplierId: string | null | undefined,
  supplierName: string | null | undefined,
): Promise<string | undefined> {
  if (supplierName) return supplierName;
  if (!supplierId) return undefined;
  const sup = (await tenantStore()).suppliers.find((s) => s.id === supplierId);
  return sup?.company || sup?.name || undefined;
}

export async function createExpense(
  input: z.infer<typeof ExpenseSchema>,
): Promise<ActionResult> {
  await verifySession();
  const parsed = ExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Dépense invalide" };
  }

  try {
    const id = `exp_${Math.random().toString(36).slice(2, 8)}`;
    const expense: Expense = {
      id,
      date: parsed.data.date,
      description: parsed.data.description,
      amount: parsed.data.amount,
      currency: parsed.data.currency as CurrencyCode,
      categoryId: parsed.data.categoryId,
      supplierId: parsed.data.supplierId ?? undefined,
      supplierName: await resolveSupplierName(
        parsed.data.supplierId,
        parsed.data.supplierName,
      ),
      taxRate: parsed.data.taxRate,
      taxDeductible: parsed.data.taxDeductible,
      taxAmount: parsed.data.taxAmount,
      notes: parsed.data.notes ?? undefined,
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
  await verifySession();
  const parsed = ExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Dépense invalide" };
  }

  try {
    const store = await tenantStore();
    const idx = store.expenses.findIndex((e) => e.id === id);
    if (idx < 0) return { ok: false, error: "Dépense introuvable" };

    store.expenses[idx] = {
      ...store.expenses[idx],
      date: parsed.data.date,
      description: parsed.data.description,
      amount: parsed.data.amount,
      currency: parsed.data.currency as CurrencyCode,
      categoryId: parsed.data.categoryId,
      supplierId: parsed.data.supplierId ?? undefined,
      supplierName: await resolveSupplierName(
        parsed.data.supplierId,
        parsed.data.supplierName,
      ),
      taxRate: parsed.data.taxRate,
      taxDeductible: parsed.data.taxDeductible,
      taxAmount: parsed.data.taxAmount,
      notes: parsed.data.notes ?? undefined,
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

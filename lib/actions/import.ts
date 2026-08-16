"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifySession } from "@/lib/dal/session";
import {
  assertCanCreateClient,
  assertFeature,
} from "@/lib/billing/entitlements";
import { opaquePortalToken } from "@/lib/documents";
import { todayIso } from "@/lib/date";
import type { ImportEntity } from "@/lib/import/csv";
import { tenantStore } from "@/lib/mock/store";
import type { Client } from "@/lib/data/clients";
import type { CatalogItem } from "@/lib/data/catalog";
import type { Expense } from "@/lib/data/expenses";
import type { CurrencyCode } from "@/lib/money";

export type ActionResult =
  | { ok: true; id?: string; count?: number }
  | { ok: false; error: string };

const RowSchema = z.record(z.string(), z.string());

export async function importRows(
  entity: ImportEntity,
  rows: Record<string, string>[],
): Promise<ActionResult> {
  const session = await verifySession();
  try {
    await assertFeature(
      session.organizationId,
      session.organization.planId,
      "importTool",
    );
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Import non autorisé",
    };
  }

  const entityParsed = z
    .enum(["clients", "expenses", "catalog"])
    .safeParse(entity);
  if (!entityParsed.success) {
    return { ok: false, error: "Type d’import invalide" };
  }

  const parsedRows = z.array(RowSchema).safeParse(rows);
  if (!parsedRows.success || parsedRows.data.length === 0) {
    return { ok: false, error: "Aucune ligne à importer" };
  }

  try {
    const store = await tenantStore();
    let imported = 0;

    if (entityParsed.data === "clients") {
      for (const row of parsedRows.data) {
        if (!row.name?.trim() || !row.email?.trim()) continue;
        await assertCanCreateClient(
          session.organizationId,
          session.organization.planId,
        );
        const client: Client = {
          id: `cli_${Math.random().toString(36).slice(2, 8)}`,
          name: row.name.trim(),
          company: row.company?.trim() ?? "",
          email: row.email.trim(),
          phone: row.phone?.trim() || undefined,
          city: row.city?.trim() || undefined,
          country: row.country?.trim() || undefined,
          remindersEnabled: true,
          portalToken: `cli-${opaquePortalToken().slice(0, 12)}`,
        };
        store.clients.unshift(client);
        imported++;
      }
    }

    if (entityParsed.data === "catalog") {
      for (const row of parsedRows.data) {
        if (!row.name?.trim()) continue;
        const item: CatalogItem = {
          id: `cat_item_${Math.random().toString(36).slice(2, 8)}`,
          name: row.name.trim(),
          description: row.description?.trim() ?? "",
          unitPrice: Number(row.unitPrice) || 0,
          taxRate: Number(row.taxRate) || 0,
          unit: row.unit?.trim() || "unité",
          kind: "service",
          currency: "XOF",
        };
        store.catalogItems.unshift(item);
        imported++;
      }
    }

    if (entityParsed.data === "expenses") {
      let fallback = store.expenseCategories[0];
      if (!fallback) {
        fallback = { id: "cat_autres", name: "Autres", color: "#888888" };
        store.expenseCategories.push(fallback);
      }

      for (const row of parsedRows.data) {
        if (!row.description?.trim() || !row.amount) continue;
        const amount = Number(row.amount) || 0;
        if (amount <= 0) continue;

        const category =
          store.expenseCategories.find(
            (c) =>
              c.name.toLowerCase() ===
              (row.category ?? "").trim().toLowerCase(),
          ) ?? fallback;

        const expense: Expense = {
          id: `exp_${Math.random().toString(36).slice(2, 8)}`,
          date: row.date?.trim() || todayIso(),
          description: row.description.trim(),
          amount,
          currency: "XOF" as CurrencyCode,
          categoryId: category.id,
          supplierName: row.supplier?.trim() || undefined,
          taxRate: 0,
          taxDeductible: true,
          taxAmount: 0,
        };
        store.expenses.unshift(expense);
        imported++;
      }
    }

    revalidatePath("/clients");
    revalidatePath("/expenses");
    revalidatePath("/catalog");
    revalidatePath("/import");
    revalidatePath("/dashboard");
    return { ok: true, count: imported };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur d’importation",
    };
  }
}

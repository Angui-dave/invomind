"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifySession } from "@/lib/dal/session";
import {
  cancelTenantSubscription,
  setTenantPlan,
} from "@/lib/mock/central";
import { tenantStoreById } from "@/lib/mock/store";
import type { PlanId } from "@/lib/data/settings";
import { todayIso } from "@/lib/date";

export type ActionResult =
  | { ok: true; url?: string; message?: string }
  | { ok: false; error: string };

export async function createCheckoutSession(): Promise<ActionResult> {
  await verifySession();
  return {
    ok: false,
    error:
      "Stripe n’est pas configuré. Utilisez le changement de plan manuel en développement, ou définissez STRIPE_SECRET_KEY.",
  };
}

const PlanSchema = z.enum(["free", "pro", "business"]);

export async function changePlan(planId: PlanId): Promise<ActionResult> {
  const session = await verifySession();
  if (session.role !== "owner" && session.role !== "admin") {
    return { ok: false, error: "Action réservée aux administrateurs" };
  }

  const parsed = PlanSchema.safeParse(planId);
  if (!parsed.success) {
    return { ok: false, error: "Plan invalide" };
  }

  const sub = setTenantPlan(session.organizationId, parsed.data, "active");
  const store = tenantStoreById(session.organizationId);

  if (parsed.data !== "free") {
    store.billingHistory.unshift({
      id: `bill_${Date.now()}`,
      date: todayIso(),
      description: `Abonnement ${parsed.data} — activation`,
      amount:
        parsed.data === "pro"
          ? 12_000
          : parsed.data === "business"
            ? 29_000
            : 0,
      currency: store.branding.currency,
      status: "paid",
    });
  }

  // Sync legacy user.plan field if present on demo-shaped data — no longer used
  void sub;

  revalidatePath("/settings");
  revalidatePath("/billing");
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: `Organisation passée au plan ${parsed.data}`,
  };
}

/** @deprecated Prefer changePlan("pro") */
export async function upgradeToProManual(): Promise<ActionResult> {
  return changePlan("pro");
}

export async function cancelSubscription(): Promise<ActionResult> {
  const session = await verifySession();
  if (session.role !== "owner" && session.role !== "admin") {
    return { ok: false, error: "Action réservée aux administrateurs" };
  }

  cancelTenantSubscription(session.organizationId);

  revalidatePath("/settings");
  revalidatePath("/billing");
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: "Abonnement annulé — retour au plan Gratuit",
  };
}

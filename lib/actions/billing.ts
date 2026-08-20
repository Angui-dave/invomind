"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { actionErrorMessage } from "@/lib/laravel/action-errors";
import { getApiContext } from "@/lib/laravel/context";
import {
  cancelTenantSubscription,
  setTenantPlan,
} from "@/lib/mock/central";
import type { PlanId } from "@/lib/data/settings";

export type ActionResult =
  | { ok: true; url?: string; message?: string }
  | { ok: false; error: string };

const PlanSchema = z.enum(["free", "pro", "business"]);
const PaidPlanSchema = z.enum(["pro", "business"]);

/** Start a prepaid CinetPay checkout for Pro/Business. */
export async function createCheckoutSession(
  planId: PlanId,
  customerPhone?: string,
): Promise<ActionResult> {
  const session = await verifySession();
  if (session.role !== "owner" && session.role !== "admin") {
    return { ok: false, error: "Action réservée aux administrateurs" };
  }

  const parsed = PaidPlanSchema.safeParse(planId);
  if (!parsed.success) {
    return { ok: false, error: "Seuls Pro et Business nécessitent un paiement CinetPay" };
  }

  if (isLaravelApiEnabled()) {
    try {
      const { token, organizationId } = await getApiContext();
      const res = await laravelRequest<{
        checkout_url?: string;
        message?: string;
      }>("/billing/checkout", {
        method: "POST",
        token,
        organizationId,
        body: {
          plan_id: parsed.data,
          ...(customerPhone ? { customer_phone: customerPhone } : {}),
        },
      });
      if (!res.checkout_url) {
        return { ok: false, error: "CinetPay n’a pas renvoyé d’URL de paiement" };
      }
      return { ok: true, url: res.checkout_url };
    } catch (e) {
      return {
        ok: false,
        error: actionErrorMessage(e, "Impossible de démarrer le paiement CinetPay"),
      };
    }
  }

  // Mock mode: activate immediately without PSP.
  setTenantPlan(session.organizationId, parsed.data, "active");
  revalidatePath("/billing");
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: `Plan ${parsed.data} activé (mode démo)`,
  };
}

export async function changePlan(planId: PlanId): Promise<ActionResult> {
  const session = await verifySession();
  if (session.role !== "owner" && session.role !== "admin") {
    return { ok: false, error: "Action réservée aux administrateurs" };
  }

  const parsed = PlanSchema.safeParse(planId);
  if (!parsed.success) {
    return { ok: false, error: "Plan invalide" };
  }

  // Paid plans must use CinetPay checkout.
  if (parsed.data !== "free") {
    return createCheckoutSession(parsed.data);
  }

  if (isLaravelApiEnabled()) {
    try {
      const { token, organizationId } = await getApiContext();
      const res = await laravelRequest<{ message?: string }>("/billing/change-plan", {
        method: "POST",
        token,
        organizationId,
        body: { plan_id: parsed.data },
      });
      revalidatePath("/settings");
      revalidatePath("/billing");
      revalidatePath("/dashboard");
      return {
        ok: true,
        message: res.message ?? `Organisation passée au plan ${parsed.data}`,
      };
    } catch (e) {
      return {
        ok: false,
        error: actionErrorMessage(e, "Impossible de changer de plan"),
      };
    }
  }

  const sub = setTenantPlan(session.organizationId, parsed.data, "active");
  void sub;

  revalidatePath("/settings");
  revalidatePath("/billing");
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: `Organisation passée au plan ${parsed.data}`,
  };
}

/** @deprecated Prefer changePlan("pro") or createCheckoutSession */
export async function upgradeToProManual(): Promise<ActionResult> {
  return createCheckoutSession("pro");
}

export async function cancelSubscription(): Promise<ActionResult> {
  const session = await verifySession();
  if (session.role !== "owner" && session.role !== "admin") {
    return { ok: false, error: "Action réservée aux administrateurs" };
  }

  if (isLaravelApiEnabled()) {
    try {
      const { token, organizationId } = await getApiContext();
      const res = await laravelRequest<{ message?: string }>("/billing/cancel", {
        method: "POST",
        token,
        organizationId,
      });
      revalidatePath("/settings");
      revalidatePath("/billing");
      revalidatePath("/dashboard");
      return {
        ok: true,
        message: res.message ?? "Abonnement annulé — retour au plan Gratuit",
      };
    } catch (e) {
      return {
        ok: false,
        error: actionErrorMessage(e, "Impossible d’annuler l’abonnement"),
      };
    }
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

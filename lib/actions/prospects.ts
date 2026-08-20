"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { actionErrorMessage } from "@/lib/laravel/action-errors";
import { getApiContext } from "@/lib/laravel/context";
import { assertFeature } from "@/lib/billing/entitlements";
import { tenantStore } from "@/lib/mock/store";
import { todayIso } from "@/lib/date";
import type { Prospect } from "@/lib/data/settings";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

const ProspectSchema = z.object({
  name: z.string().min(2),
  company: z.string().default(""),
  estimatedValue: z.number().positive(),
  stage: z
    .enum(["nouveau", "qualifie", "devis", "negociation", "gagne", "perdu"])
    .default("nouveau"),
  lastInteractionAt: z.string().optional(),
});

export async function createProspect(
  input: z.infer<typeof ProspectSchema>,
): Promise<ActionResult> {
  if (isLaravelApiEnabled()) {
    const parsed = ProspectSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Prospect invalide" };
    try {
      const { token, organizationId } = await getApiContext();
      const created = await laravelRequest<{ id: string }>("/prospects", {
        method: "POST",
        token,
        organizationId,
        body: {
          name: parsed.data.name,
          company: parsed.data.company,
          estimated_value: parsed.data.estimatedValue,
          stage: parsed.data.stage,
        },
      });
      revalidatePath("/clients");
      revalidatePath("/dashboard");
      return { ok: true, id: created.id };
    } catch (error) {
      return {
        ok: false,
        error: actionErrorMessage(error, "Pipeline non autorisé"),
      };
    }
  }
  const session = await verifySession();
  try {
    await assertFeature(
      session.organizationId,
      session.organization.planId,
      "pipeline",
    );
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Pipeline non autorisé",
    };
  }

  const parsed = ProspectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Prospect invalide" };
  }

  const id = `prs_${Math.random().toString(36).slice(2, 8)}`;
  const prospect: Prospect = {
    id,
    name: parsed.data.name,
    company: parsed.data.company || "—",
    estimatedValue: parsed.data.estimatedValue,
    stage: parsed.data.stage,
    lastInteractionAt: parsed.data.lastInteractionAt ?? todayIso(),
  };

  (await tenantStore()).prospects.unshift(prospect);

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { ok: true, id };
}

export async function updateProspectStage(
  id: string,
  stage: z.infer<typeof ProspectSchema>["stage"],
): Promise<ActionResult> {
  if (isLaravelApiEnabled()) {
    try {
      const { token, organizationId } = await getApiContext();
      await laravelRequest(`/prospects/${id}/stage`, {
        method: "PUT",
        token,
        organizationId,
        body: { stage },
      });
      revalidatePath("/clients");
      revalidatePath("/dashboard");
      return { ok: true, id };
    } catch (error) {
      return {
        ok: false,
        error: actionErrorMessage(error, "Étape invalide"),
      };
    }
  }
  const session = await verifySession();
  try {
    await assertFeature(
      session.organizationId,
      session.organization.planId,
      "pipeline",
    );
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Pipeline non autorisé",
    };
  }

  const parsed = z
    .enum(["nouveau", "qualifie", "devis", "negociation", "gagne", "perdu"])
    .safeParse(stage);
  if (!parsed.success) {
    return { ok: false, error: "Étape invalide" };
  }

  const store = await tenantStore();
  const idx = store.prospects.findIndex((p) => p.id === id);
  if (idx < 0) return { ok: false, error: "Prospect introuvable" };

  store.prospects[idx] = {
    ...store.prospects[idx],
    stage: parsed.data,
    lastInteractionAt: todayIso(),
  };

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { ok: true, id };
}

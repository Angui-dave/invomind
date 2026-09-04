"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { createClient, updateClientCategory } from "@/lib/actions/clients";
import { tenantStore } from "@/lib/mock/store";
import { todayIso } from "@/lib/date";
import type { Prospect } from "@/lib/data/settings";
import type { PipelineStage } from "@/lib/data/settings";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

const StageSchema = z.enum([
  "prospect",
  "qualifie",
  "negociation",
  "client",
  "inactif",
]);

const ProspectSchema = z.object({
  name: z.string().min(2),
  company: z.string().default(""),
  estimatedValue: z.number().min(0).default(0),
  stage: StageSchema.default("prospect"),
  lastInteractionAt: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

/**
 * Create a pipeline card = create a client with categorie_client.
 * Legacy `/prospects` route no longer exists.
 */
export async function createProspect(
  input: z.infer<typeof ProspectSchema>,
): Promise<ActionResult> {
  const parsed = ProspectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Prospect invalide" };

  if (isLaravelApiEnabled()) {
    const email =
      parsed.data.email && parsed.data.email.length > 0
        ? parsed.data.email
        : `prospect+${Date.now()}@placeholder.local`;
    const result = await createClient({
      name: parsed.data.name,
      company: parsed.data.company || parsed.data.name,
      email,
      categorieClient: parsed.data.stage,
      remindersEnabled: true,
    });
    revalidatePath("/clients");
    revalidatePath("/dashboard");
    return result;
  }

  await verifySession();
  const id = `prs_${Math.random().toString(36).slice(2, 8)}`;
  const prospect: Prospect = {
    id,
    name: parsed.data.name,
    company: parsed.data.company,
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
  stage: PipelineStage,
): Promise<ActionResult> {
  const parsed = StageSchema.safeParse(stage);
  if (!parsed.success) return { ok: false, error: "Étape invalide" };

  if (isLaravelApiEnabled()) {
    const result = await updateClientCategory(id, parsed.data);
    revalidatePath("/clients");
    revalidatePath("/dashboard");
    return result;
  }

  await verifySession();
  const store = await tenantStore();
  const idx = store.prospects.findIndex((p) => p.id === id);
  if (idx < 0) return { ok: false, error: "Prospect introuvable" };
  store.prospects[idx] = {
    ...store.prospects[idx],
    stage: parsed.data,
    lastInteractionAt: todayIso(),
  };
  revalidatePath("/clients");
  return { ok: true, id };
}

/** Convert pipeline card to "client" category (was: create Client from Prospect). */
export async function convertProspectToClient(
  id: string,
): Promise<ActionResult> {
  return updateProspectStage(id, "client");
}

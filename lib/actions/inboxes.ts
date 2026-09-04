"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isLaravelApiEnabled } from "@/lib/config";
import { actionErrorMessage } from "@/lib/laravel/action-errors";
import { getApiContext } from "@/lib/laravel/context";
import { laravelRequest } from "@/lib/laravel/client";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

const InboxSchema = z.object({
  canal: z.enum(["whatsapp", "messenger", "instagram", "tiktok"]),
  nom: z.string().min(1).max(255),
  mode: z.enum(["fake", "sandbox", "production"]).default("fake"),
  identifiants: z
    .object({
      access_token: z.string().optional(),
      phone_number_id: z.string().optional(),
      waba_id: z.string().optional(),
      page_id: z.string().optional(),
      ig_business_id: z.string().optional(),
      external_id: z.string().optional(),
    })
    .optional(),
});

const LabelCreateSchema = z.object({
  nom: z.string().min(1).max(100),
  couleur: z.string().max(32).optional(),
});

export async function createInbox(
  input: z.infer<typeof InboxSchema>,
): Promise<ActionResult> {
  if (!isLaravelApiEnabled()) {
    return { ok: false, error: "API Laravel requise" };
  }
  const parsed = InboxSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Boîte invalide" };

  try {
    const { token, organizationId } = await getApiContext();
    const created = await laravelRequest<{ id: string | number }>("/inboxes", {
      method: "POST",
      token,
      organizationId,
      body: {
        canal: parsed.data.canal,
        nom: parsed.data.nom,
        mode: parsed.data.mode,
        identifiants: parsed.data.identifiants ?? {
          external_id: "fake-inbox",
        },
      },
    });
    revalidatePath("/conversations");
    revalidatePath("/settings");
    return { ok: true, id: String(created.id) };
  } catch (e) {
    return { ok: false, error: actionErrorMessage(e, "Erreur boîte") };
  }
}

export async function deleteInbox(id: string): Promise<ActionResult> {
  if (!isLaravelApiEnabled()) {
    return { ok: false, error: "API Laravel requise" };
  }
  try {
    const { token, organizationId } = await getApiContext();
    await laravelRequest(`/inboxes/${id}`, {
      method: "DELETE",
      token,
      organizationId,
    });
    revalidatePath("/conversations");
    revalidatePath("/settings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: actionErrorMessage(e, "Erreur suppression") };
  }
}

export async function createLabel(
  input: z.infer<typeof LabelCreateSchema>,
): Promise<ActionResult> {
  if (!isLaravelApiEnabled()) {
    return { ok: false, error: "API Laravel requise" };
  }
  const parsed = LabelCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Étiquette invalide" };

  try {
    const { token, organizationId } = await getApiContext();
    const created = await laravelRequest<{ id: string | number }>("/labels", {
      method: "POST",
      token,
      organizationId,
      body: {
        nom: parsed.data.nom,
        couleur: parsed.data.couleur ?? "#64748b",
      },
    });
    revalidatePath("/conversations");
    return { ok: true, id: String(created.id) };
  } catch (e) {
    return { ok: false, error: actionErrorMessage(e, "Erreur étiquette") };
  }
}

export type MessageTemplateDto = {
  id: string;
  name: string;
  language: string;
  category: string;
  preview: string | null;
  status: string;
  components: unknown;
};

export async function listInboxTemplates(
  inboxId: string,
): Promise<{ ok: true; templates: MessageTemplateDto[] } | { ok: false; error: string }> {
  if (!isLaravelApiEnabled()) {
    return { ok: false, error: "API Laravel requise" };
  }
  try {
    const { token, organizationId } = await getApiContext();
    const { unwrapList } = await import("@/lib/laravel/pagination");
    const rows = unwrapList(
      await laravelRequest<unknown>(`/inboxes/${inboxId}/templates`, {
        token,
        organizationId,
      }),
    );
    return {
      ok: true,
      templates: rows.map((row) => {
        const r = row as Record<string, unknown>;
        return {
          id: String(r.id ?? ""),
          name: String(r.nom ?? ""),
          language: String(r.langue ?? "fr"),
          category: String(r.categorie ?? "utility"),
          preview: r.corps_apercu ? String(r.corps_apercu) : null,
          status: String(r.statut_approbation ?? ""),
          components: r.composants ?? [],
        };
      }),
    };
  } catch (e) {
    return { ok: false, error: actionErrorMessage(e, "Erreur modèles") };
  }
}

export async function syncInboxTemplates(
  inboxId: string,
): Promise<ActionResult> {
  if (!isLaravelApiEnabled()) {
    return { ok: false, error: "API Laravel requise" };
  }
  try {
    const { token, organizationId } = await getApiContext();
    await laravelRequest(`/inboxes/${inboxId}/templates/sync`, {
      method: "POST",
      token,
      organizationId,
      body: {},
    });
    revalidatePath("/conversations");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: actionErrorMessage(e, "Erreur sync modèles") };
  }
}

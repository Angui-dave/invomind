"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isLaravelApiEnabled } from "@/lib/config";
import { actionErrorMessage } from "@/lib/laravel/action-errors";
import { getApiContext } from "@/lib/laravel/context";
import { laravelRequest } from "@/lib/laravel/client";
import { mapConversationMessage } from "@/lib/laravel/mappers";
import type { Conversation, ConversationMessage } from "@/lib/data/conversations";

export type ActionResult =
  | { ok: true; message?: ConversationMessage }
  | { ok: false; error: string };

const SendSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().max(4096).optional().default(""),
  contentType: z
    .enum(["texte", "image", "fichier", "audio", "video", "modele"])
    .optional()
    .default("texte"),
  mediaUrl: z.string().url().optional().nullable(),
  /** Template payload JSON string when contentType=modele */
  templatePayload: z.string().optional(),
});

const StatusSchema = z.object({
  conversationId: z.string().min(1),
  status: z.enum(["open", "pending", "resolved"]),
});

const AssignSchema = z.object({
  conversationId: z.string().min(1),
  agentId: z.string().nullable(),
});

const LabelSchema = z.object({
  conversationId: z.string().min(1),
  labelId: z.string().min(1),
});

const statusToApi: Record<"open" | "pending" | "resolved", string> = {
  open: "ouverte",
  pending: "en_attente",
  resolved: "resolue",
};

export async function sendConversationMessage(
  input: z.infer<typeof SendSchema>,
): Promise<ActionResult> {
  if (!isLaravelApiEnabled()) {
    return { ok: false, error: "API Laravel requise pour l’envoi" };
  }
  const parsed = SendSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Message invalide" };

  const { conversationId, body, contentType, mediaUrl, templatePayload } =
    parsed.data;

  if (contentType === "texte" && !body.trim()) {
    return { ok: false, error: "Message invalide" };
  }
  if (
    ["image", "fichier", "audio", "video"].includes(contentType) &&
    !mediaUrl
  ) {
    return { ok: false, error: "URL média requise" };
  }

  try {
    const { token, organizationId } = await getApiContext();
    const created = await laravelRequest<unknown>(
      `/conversations/${conversationId}/messages`,
      {
        method: "POST",
        token,
        organizationId,
        body: {
          contenu:
            contentType === "modele" && templatePayload
              ? templatePayload
              : body,
          type_contenu: contentType,
          url_media: mediaUrl ?? null,
        },
      },
    );
    revalidatePath("/conversations");
    return { ok: true, message: mapConversationMessage(created) };
  } catch (e) {
    return { ok: false, error: actionErrorMessage(e, "Échec de l’envoi") };
  }
}

export async function updateConversationStatus(
  input: z.infer<typeof StatusSchema>,
): Promise<ActionResult> {
  if (!isLaravelApiEnabled()) {
    return { ok: false, error: "API Laravel requise" };
  }
  const parsed = StatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Statut invalide" };

  try {
    const { token, organizationId } = await getApiContext();
    await laravelRequest(`/conversations/${parsed.data.conversationId}/status`, {
      method: "PUT",
      token,
      organizationId,
      body: { statut: statusToApi[parsed.data.status] },
    });
    revalidatePath("/conversations");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: actionErrorMessage(e, "Erreur statut") };
  }
}

export async function assignConversation(
  input: z.infer<typeof AssignSchema>,
): Promise<ActionResult> {
  if (!isLaravelApiEnabled()) {
    return { ok: false, error: "API Laravel requise" };
  }
  const parsed = AssignSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Assignation invalide" };

  try {
    const { token, organizationId } = await getApiContext();
    await laravelRequest(`/conversations/${parsed.data.conversationId}/assign`, {
      method: "PUT",
      token,
      organizationId,
      body: {
        agent_id: parsed.data.agentId ? Number(parsed.data.agentId) : null,
      },
    });
    revalidatePath("/conversations");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: actionErrorMessage(e, "Erreur assignation") };
  }
}

export async function attachConversationLabel(
  input: z.infer<typeof LabelSchema>,
): Promise<ActionResult> {
  if (!isLaravelApiEnabled()) {
    return { ok: false, error: "API Laravel requise" };
  }
  const parsed = LabelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Étiquette invalide" };

  try {
    const { token, organizationId } = await getApiContext();
    await laravelRequest(
      `/conversations/${parsed.data.conversationId}/labels/${parsed.data.labelId}`,
      {
        method: "POST",
        token,
        organizationId,
      },
    );
    revalidatePath("/conversations");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: actionErrorMessage(e, "Erreur étiquette") };
  }
}

export async function detachConversationLabel(
  input: z.infer<typeof LabelSchema>,
): Promise<ActionResult> {
  if (!isLaravelApiEnabled()) {
    return { ok: false, error: "API Laravel requise" };
  }
  const parsed = LabelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Étiquette invalide" };

  try {
    const { token, organizationId } = await getApiContext();
    await laravelRequest(
      `/conversations/${parsed.data.conversationId}/labels/${parsed.data.labelId}`,
      {
        method: "DELETE",
        token,
        organizationId,
      },
    );
    revalidatePath("/conversations");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: actionErrorMessage(e, "Erreur étiquette") };
  }
}

export async function markConversationRead(
  conversationId: string,
): Promise<ActionResult> {
  if (!isLaravelApiEnabled()) return { ok: true };
  try {
    const { token, organizationId } = await getApiContext();
    await laravelRequest(`/conversations/${conversationId}/read`, {
      method: "POST",
      token,
      organizationId,
    });
    revalidatePath("/conversations");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: actionErrorMessage(e, "Erreur lecture") };
  }
}

export async function linkConversationClient(input: {
  conversationId: string;
  clientId: string | null;
}): Promise<ActionResult> {
  if (!isLaravelApiEnabled()) {
    return { ok: false, error: "API Laravel requise" };
  }
  try {
    const { token, organizationId } = await getApiContext();
    await laravelRequest(`/conversations/${input.conversationId}/contact`, {
      method: "PUT",
      token,
      organizationId,
      body: {
        client_id: input.clientId ? Number(input.clientId) : null,
      },
    });
    revalidatePath("/conversations");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: actionErrorMessage(e, "Erreur association client") };
  }
}

/** Soft refresh for Reverb disconnect fallback (no full page reload). */
export async function refreshConversationsSnapshot(): Promise<{
  ok: true;
  conversations: Conversation[];
  messages: ConversationMessage[];
} | { ok: false; error: string }> {
  if (!isLaravelApiEnabled()) {
    return { ok: false, error: "API Laravel requise" };
  }
  try {
    const { listConversations, listAllMessages } = await import(
      "@/lib/dal/conversations"
    );
    const [conversations, messages] = await Promise.all([
      listConversations(),
      listAllMessages(),
    ]);
    return { ok: true, conversations, messages };
  } catch (e) {
    return {
      ok: false,
      error: actionErrorMessage(e, "Erreur rafraîchissement"),
    };
  }
}

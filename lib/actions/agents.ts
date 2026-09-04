"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { z } from "zod";
import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { actionErrorMessage } from "@/lib/laravel/action-errors";
import { mapTenantRoleToAppRole } from "@/lib/rbac/types";
import { isAdminTenant } from "@/lib/rbac/policy";
import { getAgentService } from "@/lib/services/agent";

export type ActionResult =
  | { ok: true; id?: string; temporaryPassword?: string }
  | { ok: false; error: string };

async function assertAdmin() {
  const session = await verifySession();
  const role = mapTenantRoleToAppRole(session.role);
  if (!isAdminTenant(role)) {
    throw new Error("Action réservée aux administrateurs");
  }
  return session;
}

const InviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).optional(),
  role: z.enum(["admin", "member", "agent"]).optional(),
});

function generateTempPassword(): string {
  return `Ag${randomBytes(4).toString("hex")}9a`;
}

export async function inviteAgent(
  input: z.infer<typeof InviteSchema>,
): Promise<ActionResult> {
  let session;
  try {
    session = await assertAdmin();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Non autorisé" };
  }

  const parsed = InviteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Données d'invitation invalides" };
  }

  const fullName =
    parsed.data.name?.trim() ||
    parsed.data.email.split("@")[0] ||
    "Agent";
  const temporaryPassword = generateTempPassword();

  if (isLaravelApiEnabled()) {
    try {
      const token = (await readSessionCookie())?.accessToken;
      const agent = await laravelRequest<{ id: string | number }>("/agents", {
        method: "POST",
        token,
        organizationId: session.organizationId,
        body: {
          full_name: fullName,
          email: parsed.data.email.toLowerCase(),
          password: temporaryPassword,
        },
      });
      revalidatePath("/agents");
      return {
        ok: true,
        id: String(agent.id),
        temporaryPassword,
      };
    } catch (error) {
      return {
        ok: false,
        error: actionErrorMessage(error, "Création de l’agent impossible"),
      };
    }
  }

  try {
    const agent = await getAgentService().inviteAgent(session.organizationId, {
      name: fullName,
      email: parsed.data.email,
    });
    revalidatePath("/agents");
    return { ok: true, id: agent.id, temporaryPassword };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function disableAgent(agentId: string): Promise<ActionResult> {
  let session;
  try {
    session = await assertAdmin();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Non autorisé" };
  }

  if (isLaravelApiEnabled()) {
    try {
      const token = (await readSessionCookie())?.accessToken;
      await laravelRequest(`/agents/${agentId}/disable`, {
        method: "PUT",
        token,
        organizationId: session.organizationId,
      });
      revalidatePath("/agents");
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: actionErrorMessage(error, "Impossible de désactiver l’agent"),
      };
    }
  }

  const ok = await getAgentService().disableAgent(
    session.organizationId,
    agentId,
  );
  if (!ok) return { ok: false, error: "Agent introuvable" };

  revalidatePath("/agents");
  return { ok: true };
}

export async function enableAgent(agentId: string): Promise<ActionResult> {
  let session;
  try {
    session = await assertAdmin();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Non autorisé" };
  }

  if (isLaravelApiEnabled()) {
    try {
      const token = (await readSessionCookie())?.accessToken;
      await laravelRequest(`/agents/${agentId}/enable`, {
        method: "PUT",
        token,
        organizationId: session.organizationId,
      });
      revalidatePath("/agents");
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: actionErrorMessage(error, "Impossible de réactiver l’agent"),
      };
    }
  }

  const ok = await getAgentService().enableAgent(
    session.organizationId,
    agentId,
  );
  if (!ok) return { ok: false, error: "Agent introuvable" };

  revalidatePath("/agents");
  return { ok: true };
}

export async function revokeInvitation(
  _invitationId: string,
): Promise<ActionResult> {
  return {
    ok: false,
    error: "Les invitations e-mail ne sont plus utilisées. Créez un agent directement.",
  };
}

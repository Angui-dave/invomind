"use server";

import { revalidatePath } from "next/cache";
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
  | { ok: true; id?: string }
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
  role: z.enum(["admin", "member"]).optional(),
});

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

  if (isLaravelApiEnabled()) {
    try {
      const token = (await readSessionCookie())?.accessToken;
      const invitation = await laravelRequest<{ id: string }>(
        "/organization/invitations",
        {
          method: "POST",
          token,
          organizationId: session.organizationId,
          body: {
            email: parsed.data.email,
            role: parsed.data.role ?? "member",
          },
        },
      );
      revalidatePath("/agents");
      return { ok: true, id: invitation.id };
    } catch (error) {
      return {
        ok: false,
        error: actionErrorMessage(error, "Invitation impossible"),
      };
    }
  }

  try {
    const agent = await getAgentService().inviteAgent(session.organizationId, {
      name: parsed.data.email.split("@")[0] ?? "Agent",
      email: parsed.data.email,
    });
    revalidatePath("/agents");
    return { ok: true, id: agent.id };
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
  invitationId: string,
): Promise<ActionResult> {
  let session;
  try {
    session = await assertAdmin();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Non autorisé" };
  }

  if (!isLaravelApiEnabled()) {
    return { ok: false, error: "Révocation disponible uniquement avec Laravel" };
  }

  try {
    const token = (await readSessionCookie())?.accessToken;
    await laravelRequest(`/organization/invitations/${invitationId}`, {
      method: "DELETE",
      token,
      organizationId: session.organizationId,
    });
    revalidatePath("/agents");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: actionErrorMessage(error, "Impossible de révoquer l’invitation"),
    };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifySession } from "@/lib/dal/session";
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

const CreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const InviteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

const UpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

export async function createAgent(
  input: z.infer<typeof CreateSchema>,
): Promise<ActionResult> {
  let session;
  try {
    session = await assertAdmin();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Non autorisé" };
  }

  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Données agent invalides" };
  }

  try {
    const agent = await getAgentService().createAgent(
      session.organizationId,
      parsed.data,
    );
    revalidatePath("/agents");
    return { ok: true, id: agent.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
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

  try {
    const agent = await getAgentService().inviteAgent(
      session.organizationId,
      parsed.data,
    );
    revalidatePath("/agents");
    return { ok: true, id: agent.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateAgent(
  agentId: string,
  input: z.infer<typeof UpdateSchema>,
): Promise<ActionResult> {
  let session;
  try {
    session = await assertAdmin();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Non autorisé" };
  }

  const parsed = UpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Données invalides" };
  }

  const result = await getAgentService().updateAgent(
    session.organizationId,
    agentId,
    parsed.data,
  );
  if (!result) return { ok: false, error: "Agent introuvable" };

  revalidatePath("/agents");
  return { ok: true, id: agentId };
}

export async function disableAgent(agentId: string): Promise<ActionResult> {
  let session;
  try {
    session = await assertAdmin();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Non autorisé" };
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

  const ok = await getAgentService().enableAgent(
    session.organizationId,
    agentId,
  );
  if (!ok) return { ok: false, error: "Agent introuvable" };

  revalidatePath("/agents");
  return { ok: true };
}

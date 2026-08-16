"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, deleteSession } from "@/lib/auth/session";
import {
  findUserByEmail,
  membershipsForUser,
  provisionTenant,
} from "@/lib/mock/central";
import { registerTenantStore, tenantStoreById } from "@/lib/mock/store";

export type AuthFormState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    company?: string[];
    form?: string[];
  };
  message?: string;
};

const LoginSchema = z.object({
  email: z.email({ error: "Saisissez une adresse e-mail valide" }).trim(),
  password: z
    .string()
    .min(8, { error: "Le mot de passe doit contenir au moins 8 caractères" }),
});

const RegisterSchema = LoginSchema.extend({
  name: z
    .string()
    .min(2, { error: "Le nom doit contenir au moins 2 caractères" })
    .trim(),
  company: z
    .string()
    .min(2, { error: "Le nom de l’entreprise est requis" })
    .trim(),
});

function verifyMockPassword(password: string, hash: string): boolean {
  if (hash.startsWith("mock$")) {
    return hash.slice(5) === password;
  }
  return password.length >= 8;
}

/**
 * Mock auth — resolves tenant from central memberships.
 * Demo: lea@atelier-diallo.sn / password123
 * Later: POST /api/login on Laravel Sanctum + InitializeTenancyByUser.
 */
export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const email = parsed.data.email.toLowerCase();
  const user = findUserByEmail(email);

  if (!user || !verifyMockPassword(parsed.data.password, user.passwordHash)) {
    return { errors: { form: ["E-mail ou mot de passe incorrect"] } };
  }

  const memberships = membershipsForUser(user.id);
  if (memberships.length === 0) {
    return { errors: { form: ["Aucun espace de travail associé"] } };
  }

  const tenantId =
    (user.lastTenantId &&
      memberships.some((m) => m.tenantId === user.lastTenantId) &&
      user.lastTenantId) ||
    memberships[0].tenantId;

  user.lastTenantId = tenantId;
  // Ensure tenant DB exists (demo is pre-seeded)
  tenantStoreById(tenantId);

  await createSession(user.id, tenantId);
  redirect("/dashboard");
}

export async function register(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    company: formData.get("company") ?? formData.get("name"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const { tenant, user } = provisionTenant({
      companyName: parsed.data.company,
      userName: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });

    registerTenantStore(tenant.id, {
      companyName: parsed.data.company,
      email: parsed.data.email.toLowerCase(),
    });

    await createSession(user.id, tenant.id);
  } catch (err) {
    return {
      errors: {
        form: [err instanceof Error ? err.message : "Inscription impossible"],
      },
    };
  }

  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

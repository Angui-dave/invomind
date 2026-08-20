"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, deleteSession, readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { laravelRequest, LaravelApiError } from "@/lib/laravel/client";
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

  if (isLaravelApiEnabled()) {
    try {
      const res = await laravelRequest<{
        user: { id: string; email: string; name: string };
        organization_id: string;
        role?: "owner" | "admin" | "member";
        token: string;
      }>("/auth/login", {
        method: "POST",
        body: { email, password: parsed.data.password },
      });
      await createSession(res.user.id, res.organization_id, res.token, res.role);
      redirect("/dashboard");
    } catch (error) {
      if (error instanceof LaravelApiError) {
        console.error("LOGIN_API_ERROR", {
          message: error.message,
          status: error.status,
          payload: error.payload,
        });
      } else {
        console.error("LOGIN_UNKNOWN_ERROR", error);
      }
      const message =
        error instanceof LaravelApiError
          ? error.message
          : "E-mail ou mot de passe incorrect";
      return { errors: { form: [message] } };
    }
  }
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

  if (isLaravelApiEnabled()) {
    try {
      const res = await laravelRequest<{
        user: { id: string; email: string; name: string };
        organization: { id: string };
        token: string;
      }>("/auth/register", {
        method: "POST",
        body: {
          name: parsed.data.name,
          email: parsed.data.email.toLowerCase(),
          password: parsed.data.password,
          company_name: parsed.data.company,
        },
      });

      await createSession(res.user.id, res.organization.id, res.token, "owner");
    } catch (error) {
      if (error instanceof LaravelApiError) {
        console.error("REGISTER_API_ERROR", {
          message: error.message,
          status: error.status,
          payload: error.payload,
        });
      } else {
        console.error("REGISTER_UNKNOWN_ERROR", error);
      }
      return {
        errors: {
          form: [
            error instanceof LaravelApiError
              ? error.message
              : "Inscription impossible",
          ],
        },
      };
    }
    redirect("/dashboard");
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
  if (isLaravelApiEnabled()) {
    try {
      const payload = await readSessionCookie();
      if (payload?.accessToken) {
        await laravelRequest("/auth/logout", {
          method: "POST",
          token: payload.accessToken,
          organizationId: payload.organizationId,
        });
      }
    } catch {
      // ignore remote logout failure and clear local session
    }
  }
  await deleteSession();
  redirect("/login");
}

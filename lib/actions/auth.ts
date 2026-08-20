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
import { AGENT_DEFAULT_ROUTE } from "@/lib/rbac/policy";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export type AuthFormState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    company?: string[];
    form?: string[];
  };
  message?: string;
  emailVerificationRequired?: boolean;
  email?: string;
};

function redirectAfterAuth(role?: "owner" | "admin" | "member"): never {
  redirect(role === "member" ? AGENT_DEFAULT_ROUTE : "/dashboard");
}

const passwordSchema = z
  .string()
  .min(10, {
    error: "Le mot de passe doit contenir au moins 10 caractères",
  })
  .regex(/[A-Za-z]/, {
    error: "Le mot de passe doit contenir au moins une lettre",
  })
  .regex(/[0-9]/, {
    error: "Le mot de passe doit contenir au moins un chiffre",
  });

const LoginSchema = z.object({
  email: z.email({ error: "Saisissez une adresse e-mail valide" }).trim(),
  // Login accepts existing passwords; strength rules apply on register/reset.
  password: z
    .string()
    .min(1, { error: "Saisissez votre mot de passe" }),
});

const RegisterSchema = z.object({
  email: z.email({ error: "Saisissez une adresse e-mail valide" }).trim(),
  password: passwordSchema,
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
  return password.length >= 10;
}

/**
 * Auth — Laravel Sanctum when USE_LARAVEL_API=true, else in-memory mock.
 * Demo mock: lea@atelier-diallo.sn / password123
 */
export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const emailRaw = String(formData.get("email") ?? "").toLowerCase();
  const limited = consumeRateLimit(`login:${emailRaw || "unknown"}`, 5, 60_000);
  if (!limited.ok) {
    return {
      errors: {
        form: [
          `Trop de tentatives. Réessayez dans ${limited.retryAfterSec}s.`,
        ],
      },
    };
  }

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
        organization?: { id: string };
        role?: "owner" | "admin" | "member";
        token: string;
      }>("/auth/login", {
        method: "POST",
        body: { email, password: parsed.data.password },
      });
      const organizationId = res.organization_id ?? res.organization?.id;
      if (!organizationId) {
        return { errors: { form: ["Aucune organisation associée"] } };
      }
      await createSession(res.user.id, organizationId, res.token, res.role);
      redirectAfterAuth(res.role);
    } catch (error) {
      if (error instanceof LaravelApiError) {
        console.error("LOGIN_API_ERROR", {
          message: error.message,
          status: error.status,
          payload: error.payload,
        });
        const payload = error.payload as
          | { email_verification_required?: boolean; message?: string }
          | undefined;
        if (payload?.email_verification_required) {
          return {
            emailVerificationRequired: true,
            email,
            errors: {
              form: [
                payload.message ??
                  "Veuillez vérifier votre e-mail avant de vous connecter.",
              ],
            },
          };
        }
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

  const membership = memberships.find((m) => m.tenantId === tenantId);
  await createSession(user.id, tenantId, undefined, membership?.role);
  redirectAfterAuth(membership?.role);
}

export async function register(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const limited = consumeRateLimit(
    `register:${String(formData.get("email") ?? "").toLowerCase() || "unknown"}`,
    5,
    60_000,
  );
  if (!limited.ok) {
    return {
      errors: {
        form: [
          `Trop de tentatives. Réessayez dans ${limited.retryAfterSec}s.`,
        ],
      },
    };
  }

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
        message?: string;
        email_verification_required?: boolean;
        user?: { id: string; email: string; name: string };
        organization_id?: string;
        organization?: { id: string };
        role?: "owner" | "admin" | "member";
        token?: string;
      }>("/auth/register", {
        method: "POST",
        body: {
          name: parsed.data.name,
          email: parsed.data.email.toLowerCase(),
          password: parsed.data.password,
          company_name: parsed.data.company,
        },
      });

      if (res.email_verification_required || !res.token) {
        return {
          emailVerificationRequired: true,
          email: parsed.data.email.toLowerCase(),
          message:
            res.message ??
            "Compte créé. Vérifiez votre e-mail avant de vous connecter.",
        };
      }

      const organizationId = res.organization_id ?? res.organization?.id;
      if (!organizationId || !res.user) {
        return { errors: { form: ["Inscription impossible"] } };
      }
      await createSession(
        res.user.id,
        organizationId,
        res.token,
        res.role ?? "owner",
      );
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
    redirectAfterAuth("owner");
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

  redirectAfterAuth("owner");
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

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = z
    .object({
      email: z.email({ error: "Saisissez une adresse e-mail valide" }).trim(),
    })
    .safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const email = parsed.data.email.toLowerCase();

  if (isLaravelApiEnabled()) {
    try {
      await laravelRequest("/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
    } catch (error) {
      return {
        errors: {
          form: [
            error instanceof LaravelApiError
              ? error.message
              : "Impossible d’envoyer l’e-mail",
          ],
        },
      };
    }
  }

  return {
    message:
      "Si un compte existe pour cette adresse, un e-mail de réinitialisation a été envoyé.",
  };
}

export async function resetPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = z
    .object({
      token: z.string().min(1, { error: "Lien invalide" }),
      email: z.email({ error: "Saisissez une adresse e-mail valide" }).trim(),
      password: passwordSchema,
    })
    .safeParse({
      token: formData.get("token"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  if (isLaravelApiEnabled()) {
    try {
      await laravelRequest("/auth/reset-password", {
        method: "POST",
        body: {
          token: parsed.data.token,
          email: parsed.data.email.toLowerCase(),
          password: parsed.data.password,
        },
      });
    } catch (error) {
      return {
        errors: {
          form: [
            error instanceof LaravelApiError
              ? error.message
              : "Lien invalide ou déjà utilisé",
          ],
        },
      };
    }
    return { message: "Mot de passe mis à jour. Vous pouvez vous connecter." };
  }

  const user = findUserByEmail(parsed.data.email.toLowerCase());
  if (!user) {
    return { errors: { form: ["Lien invalide ou déjà utilisé"] } };
  }
  user.passwordHash = `mock$${parsed.data.password}`;
  return { message: "Mot de passe mis à jour. Vous pouvez vous connecter." };
}

export async function acceptInvitation(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = z
    .object({
      token: z.string().min(8, { error: "Invitation invalide" }),
      name: z
        .string()
        .min(2, { error: "Le nom doit contenir au moins 2 caractères" })
        .trim(),
      password: passwordSchema,
    })
    .safeParse({
      token: formData.get("token"),
      name: formData.get("name"),
      password: formData.get("password"),
    });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  if (!isLaravelApiEnabled()) {
    return {
      errors: {
        form: ["Les invitations nécessitent l’API Laravel."],
      },
    };
  }

  try {
    const res = await laravelRequest<{
      user: { id: string; email: string; name: string };
      organization_id: string;
      role?: "owner" | "admin" | "member";
      token: string;
    }>("/auth/invitations/accept", {
      method: "POST",
      body: {
        token: parsed.data.token,
        name: parsed.data.name,
        password: parsed.data.password,
      },
    });
    await createSession(
      res.user.id,
      res.organization_id,
      res.token,
      res.role,
    );
    redirectAfterAuth(res.role);
  } catch (error) {
    return {
      errors: {
        form: [
          error instanceof LaravelApiError
            ? error.message
            : "Invitation invalide ou expirée",
        ],
      },
    };
  }
}

export async function resendVerificationEmail(
  email: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const parsed = z
    .email({ error: "Saisissez une adresse e-mail valide" })
    .safeParse(email.trim().toLowerCase());
  if (!parsed.success) {
    return { ok: false, error: "Saisissez une adresse e-mail valide" };
  }

  if (!isLaravelApiEnabled()) {
    return {
      ok: true,
      message: "En mode démo, la vérification e-mail n’est pas requise.",
    };
  }

  try {
    const res = await laravelRequest<{ message?: string }>("/auth/email/resend", {
      method: "POST",
      body: { email: parsed.data },
    });
    return {
      ok: true,
      message:
        res.message ??
        "Si un compte non vérifié existe, un nouveau lien a été envoyé.",
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof LaravelApiError
          ? error.message
          : "Impossible de renvoyer l’e-mail",
    };
  }
}

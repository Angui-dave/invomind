"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  login,
  register,
  resendVerificationEmail,
  type AuthFormState,
} from "@/lib/actions/auth";
import { toast } from "sonner";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
};

const initialState: AuthFormState = {};

function passwordStrength(value: string) {
  let score = 0;
  if (value.length >= 10) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return score;
}

const STRENGTH_LABEL = ["Faible", "Faible", "Moyen", "Bon", "Fort"] as const;

export function AuthForm({ mode }: AuthFormProps) {
  const action = mode === "login" ? login : register;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [resending, setResending] = useState(false);
  const strength = useMemo(() => passwordStrength(password), [password]);

  async function handleResend() {
    const email =
      state.email ||
      (typeof document !== "undefined"
        ? (document.getElementById("email") as HTMLInputElement | null)?.value
        : "") ||
      "";
    if (!email) {
      toast.error("Saisissez votre e-mail");
      return;
    }
    setResending(true);
    const result = await resendVerificationEmail(email);
    setResending(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.error);
  }

  return (
    <div>
      <h1 className="font-serif text-xl font-semibold text-ink">
        {mode === "login" ? "Se connecter" : "Créer mon compte"}
      </h1>
      <p className="mt-1 text-sm text-ink/60">
        {mode === "login"
          ? "Accédez à votre registre de facturation."
          : "Commencez à facturer en quelques minutes."}
      </p>

      <form action={formAction} className="mt-6 space-y-4" noValidate>
        {mode === "register" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                aria-invalid={Boolean(state.errors?.name)}
                className={cn(
                  "h-10 rounded-xl",
                  state.errors?.name && "border-brick focus-visible:ring-brick/40",
                )}
              />
              {state.errors?.name && (
                <p className="text-xs text-brick">{state.errors.name[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Entreprise</Label>
              <Input
                id="company"
                name="company"
                autoComplete="organization"
                aria-invalid={Boolean(state.errors?.company)}
                className={cn(
                  "h-10 rounded-xl",
                  state.errors?.company &&
                    "border-brick focus-visible:ring-brick/40",
                )}
              />
              {state.errors?.company && (
                <p className="text-xs text-brick">{state.errors.company[0]}</p>
              )}
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(state.errors?.email)}
            className={cn(
              "h-10 rounded-xl",
              state.errors?.email && "border-brick focus-visible:ring-brick/40",
            )}
          />
          {state.errors?.email && (
            <p className="text-xs text-brick">{state.errors.email[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              aria-invalid={Boolean(state.errors?.password)}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                "h-10 rounded-xl pr-10",
                state.errors?.password &&
                  "border-brick focus-visible:ring-brick/40",
              )}
            />
            <button
              type="button"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-ink/45 hover:text-ink"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {mode === "register" && password.length > 0 && (
            <div className="space-y-1">
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: 4 }).map((_, index) => (
                  <span
                    key={index}
                    className={cn(
                      "h-1 rounded-full",
                      index < strength ? "bg-brass" : "bg-line",
                    )}
                  />
                ))}
              </div>
              <p className="text-[11px] text-ink/50">
                Force : {STRENGTH_LABEL[strength]}
              </p>
            </div>
          )}
          {state.errors?.password && (
            <p className="text-xs text-brick">{state.errors.password[0]}</p>
          )}
        </div>

        {mode === "login" && (
          <p className="-mt-2 text-right text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-ledger underline-offset-2 hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </p>
        )}

        {state.errors?.form && (
          <p className="rounded-xl border border-brick/30 bg-brick/10 px-3 py-2 text-xs text-brick">
            {state.errors.form[0]}
          </p>
        )}

        {state.message && (
          <p className="rounded-xl border border-brass/35 bg-brass/10 px-3 py-2 text-xs text-brass">
            {state.message}
          </p>
        )}

        {state.emailVerificationRequired ? (
          <Button
            type="button"
            variant="outline"
            disabled={resending}
            onClick={() => void handleResend()}
            className="h-10 w-full rounded-full"
          >
            {resending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Renvoyer l’e-mail de vérification
          </Button>
        ) : null}

        <Button
          type="submit"
          disabled={pending}
          className="h-11 w-full rounded-full bg-ledger text-paper hover:bg-ledger/90"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {mode === "login" ? "Connexion…" : "Création…"}
            </>
          ) : mode === "login" ? (
            "Se connecter"
          ) : (
            "Créer mon compte"
          )}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-ink/65">
        {mode === "login" ? (
          <>
            Pas encore de compte ?{" "}
            <Link
              href="/register"
              className="font-medium text-ledger underline-offset-2 hover:underline"
            >
              Créer mon compte
            </Link>
          </>
        ) : (
          <>
            Déjà un compte ?{" "}
            <Link
              href="/login"
              className="font-medium text-ledger underline-offset-2 hover:underline"
            >
              Se connecter
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

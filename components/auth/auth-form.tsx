"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  login,
  register,
  type AuthFormState,
} from "@/lib/actions/auth";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
};

const initialState: AuthFormState = {};

export function AuthForm({ mode }: AuthFormProps) {
  const action = mode === "login" ? login : register;
  const [state, formAction, pending] = useActionState(action, initialState);

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
              state.errors?.email && "border-brick focus-visible:ring-brick/40",
            )}
          />
          {state.errors?.email && (
            <p className="text-xs text-brick">{state.errors.email[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            aria-invalid={Boolean(state.errors?.password)}
            className={cn(
              state.errors?.password &&
                "border-brick focus-visible:ring-brick/40",
            )}
          />
          {state.errors?.password && (
            <p className="text-xs text-brick">{state.errors.password[0]}</p>
          )}
        </div>

        {state.errors?.form && (
          <p className="rounded-sm border border-brick/30 bg-brick/10 px-3 py-2 text-xs text-brick">
            {state.errors.form[0]}
          </p>
        )}

        <Button
          type="submit"
          disabled={pending}
          className="h-10 w-full bg-ledger text-paper hover:bg-ledger/90"
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

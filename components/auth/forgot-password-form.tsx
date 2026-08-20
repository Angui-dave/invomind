"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  requestPasswordReset,
  type AuthFormState,
} from "@/lib/actions/auth";

const initialState: AuthFormState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  return (
    <div>
      <h1 className="font-serif text-xl font-semibold text-ink">
        Mot de passe oublié
      </h1>
      <p className="mt-1 text-sm text-ink/60">
        Indiquez votre e-mail. Si un compte existe, vous recevrez un lien de
        réinitialisation.
      </p>

      {state.message ? (
        <p className="mt-6 rounded-xl border border-ledger/30 bg-ledger/10 px-3 py-2 text-sm text-ledger">
          {state.message}
        </p>
      ) : (
        <form action={formAction} className="mt-6 space-y-4" noValidate>
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

          {state.errors?.form && (
            <p className="rounded-xl border border-brick/30 bg-brick/10 px-3 py-2 text-xs text-brick">
              {state.errors.form[0]}
            </p>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="h-11 w-full rounded-full bg-ledger text-paper hover:bg-ledger/90"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Envoi…
              </>
            ) : (
              "Envoyer le lien"
            )}
          </Button>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-ink/65">
        <Link
          href="/login"
          className="font-medium text-ledger underline-offset-2 hover:underline"
        >
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}

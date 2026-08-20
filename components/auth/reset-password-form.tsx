"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { resetPassword, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = {};

export function ResetPasswordForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const canSubmit = Boolean(token && email);

  const hint = useMemo(() => {
    if (!token || !email) {
      return "Ce lien de réinitialisation est incomplet. Demandez un nouvel e-mail.";
    }
    return null;
  }, [token, email]);

  return (
    <div>
      <h1 className="font-serif text-xl font-semibold text-ink">
        Nouveau mot de passe
      </h1>
      <p className="mt-1 text-sm text-ink/60">
        Choisissez un mot de passe d’au moins 8 caractères.
      </p>

      {state.message ? (
        <div className="mt-6 space-y-4">
          <p className="rounded-xl border border-ledger/30 bg-ledger/10 px-3 py-2 text-sm text-ledger">
            {state.message}
          </p>
          <Button asChild className="h-11 w-full rounded-full bg-ledger text-paper hover:bg-ledger/90">
            <Link href="/login">Se connecter</Link>
          </Button>
        </div>
      ) : (
        <form action={formAction} className="mt-6 space-y-4" noValidate>
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="email" value={email} />

          {hint && (
            <p className="rounded-xl border border-brick/30 bg-brick/10 px-3 py-2 text-xs text-brick">
              {hint}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(state.errors?.password)}
                className={cn(
                  "h-10 rounded-xl pr-10",
                  state.errors?.password &&
                    "border-brick focus-visible:ring-brick/40",
                )}
              />
              <button
                type="button"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-ink/45 hover:text-ink"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
                }
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {state.errors?.password && (
              <p className="text-xs text-brick">{state.errors.password[0]}</p>
            )}
          </div>

          {state.errors?.form && (
            <p className="rounded-xl border border-brick/30 bg-brick/10 px-3 py-2 text-xs text-brick">
              {state.errors.form[0]}
            </p>
          )}

          <Button
            type="submit"
            disabled={pending || !canSubmit}
            className="h-11 w-full rounded-full bg-ledger text-paper hover:bg-ledger/90"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Enregistrement…
              </>
            ) : (
              "Enregistrer le mot de passe"
            )}
          </Button>
        </form>
      )}
    </div>
  );
}

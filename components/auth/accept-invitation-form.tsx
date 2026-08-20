"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { acceptInvitation, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = {};

export function AcceptInvitationForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    acceptInvitation,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <h1 className="font-serif text-xl font-semibold text-ink">
        Rejoindre l’équipe
      </h1>
      <p className="mt-1 text-sm text-ink/60">
        Définissez votre nom et votre mot de passe pour activer votre accès.
      </p>

      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <input type="hidden" name="token" value={token} />

        {!token && (
          <p className="rounded-xl border border-brick/30 bg-brick/10 px-3 py-2 text-xs text-brick">
            Lien d’invitation incomplet.
          </p>
        )}

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
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
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
          disabled={pending || !token}
          className="h-11 w-full rounded-full bg-ledger text-paper hover:bg-ledger/90"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Activation…
            </>
          ) : (
            "Activer mon compte"
          )}
        </Button>
      </form>
    </div>
  );
}

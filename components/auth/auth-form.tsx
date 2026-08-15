"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
};

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (mode === "register" && name.trim().length < 2) {
      next.name = "Le nom doit contenir au moins 2 caractères";
    }
    if (!isValidEmail(email.trim())) {
      next.email = "Saisissez une adresse e-mail valide";
    }
    if (password.length < 8) {
      next.password = "Le mot de passe doit contenir au moins 8 caractères";
    }
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setLoading(false);
    router.push("/dashboard");
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

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {mode === "register" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom complet</Label>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              className={cn(errors.name && "border-brick focus-visible:ring-brick/40")}
            />
            {errors.name && (
              <p id="name-error" className="text-xs text-brick">
                {errors.name}
              </p>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={cn(errors.email && "border-brick focus-visible:ring-brick/40")}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-brick">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={cn(
              errors.password && "border-brick focus-visible:ring-brick/40",
            )}
          />
          {errors.password && (
            <p id="password-error" className="text-xs text-brick">
              {errors.password}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="h-10 w-full bg-ledger text-paper hover:bg-ledger/90"
        >
          {loading ? (
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

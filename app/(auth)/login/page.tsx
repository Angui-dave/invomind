import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Se connecter",
};

type LoginPageProps = {
  searchParams: Promise<{ verified?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const verified = params.verified === "1";

  return (
    <div className="space-y-4">
      {verified ? (
        <p className="rounded-xl border border-brass/35 bg-brass/10 px-3 py-2 text-xs text-brass">
          E-mail vérifié. Vous pouvez vous connecter.
        </p>
      ) : null}
      <AuthForm mode="login" />
    </div>
  );
}

"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LedgerCard } from "@/components/ledger-card";
import { cn } from "@/lib/utils";

type FeatureGateProps = {
  allowed: boolean;
  featureLabel: string;
  children: ReactNode;
};

/** Renders children when the plan allows the feature; otherwise an upgrade prompt. */
export function FeatureGate({
  allowed,
  featureLabel,
  children,
}: FeatureGateProps) {
  if (allowed) return <>{children}</>;

  return (
    <LedgerCard>
      <div className="flex flex-col items-start gap-4 p-6 sm:p-8">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <Lock className="size-5 text-ink/50" />
        </div>
        <div>
          <h2 className="font-serif text-lg font-semibold text-ink">
            {featureLabel} — plan supérieur requis
          </h2>
          <p className="mt-1 max-w-md text-sm text-ink/65">
            Cette fonctionnalité n’est pas incluse dans votre abonnement actuel.
            Passez au plan Pro ou Business pour l’activer.
          </p>
        </div>
        <Link href="/settings" className={cn(buttonVariants())}>
          Voir les abonnements
        </Link>
      </div>
    </LedgerCard>
  );
}

type LimitBannerProps = {
  message: string;
};

export function LimitBanner({ message }: LimitBannerProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-brass/30 bg-brass/10 px-4 py-3 text-sm text-ink">
      <p>{message}</p>
      <Link
        href="/settings"
        className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
      >
        Mettre à niveau
      </Link>
    </div>
  );
}

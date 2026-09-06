"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LedgerCard } from "@/components/ledger-card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <LedgerCard>
      <div className="flex flex-col items-start gap-4 p-6 sm:p-8">
        <div className="flex size-10 items-center justify-center rounded-full bg-brick/10">
          <AlertCircle className="size-5 text-brick" aria-hidden />
        </div>
        <div>
          <h2 className="font-serif text-lg font-semibold text-ink">
            Une erreur est survenue
          </h2>
          <p className="mt-1 max-w-md text-sm text-ink/65">
            Impossible d’afficher cette page. Réessayez, ou revenez plus tard si
            le problème persiste.
          </p>
        </div>
        <Button type="button" onClick={reset}>
          Réessayer
        </Button>
      </div>
    </LedgerCard>
  );
}

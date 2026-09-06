import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  backHref?: string;
  backLabel?: string;
};

/** Shared dashboard page title row — keep outside FeatureGate so the name stays visible. */
export function PageHeader({
  title,
  description,
  actions,
  className,
  backHref,
  backLabel = "Retour",
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      <div>
        {backHref ? (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1 text-sm text-ink/60 transition-ledger hover:text-ledger"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {backLabel}
          </Link>
        ) : null}
        <h1 className="font-serif text-2xl font-semibold text-ink">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-ink/60">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

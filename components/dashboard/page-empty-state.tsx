import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

/** Shared empty list / empty feature state for dashboard pages. */
export function PageEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: PageEmptyStateProps) {
  return (
    <div
      className={cn(
        "dashboard-hero-bg flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-paper/80 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full border border-ledger/20 bg-ledger/10">
        <Icon className="size-6 text-ledger" aria-hidden />
      </div>
      <h2 className="mt-4 font-serif text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-ink/65">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

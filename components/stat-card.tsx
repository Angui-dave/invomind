import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: string;
  valueClassName?: string;
  className?: string;
  icon?: ReactNode;
};

export function StatCard({
  label,
  value,
  hint,
  trend,
  valueClassName,
  className,
  icon,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-1 overflow-hidden rounded-2xl border border-line bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium tracking-wide text-ink/60">
          {label}
        </p>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-ink/60">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-col gap-1">
        <p className={cn("text-3xl font-semibold text-ink", valueClassName)}>
          {value}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {trend && (
            <span className="rounded-full bg-brass/12 px-2 py-0.5 text-xs font-medium text-brass">
              {trend}
            </span>
          )}
          {hint && <p className="text-sm text-ink/50">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

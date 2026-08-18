import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const iconToneClass = {
  default: "bg-muted/60 text-ink/55",
  ledger: "bg-ledger/12 text-ledger",
  brass: "bg-brass/12 text-brass",
  amber: "bg-amber/12 text-amber",
  brick: "bg-brick/12 text-brick",
} as const;

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: string;
  valueClassName?: string;
  className?: string;
  icon?: ReactNode;
  tone?: keyof typeof iconToneClass;
};

export function StatCard({
  label,
  value,
  hint,
  trend,
  valueClassName,
  className,
  icon,
  tone = "default",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "glow-card-hover relative flex flex-col gap-1 overflow-hidden rounded-2xl border border-line bg-card p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium tracking-wide text-ink/60">{label}</p>
        {icon && (
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-full",
              iconToneClass[tone],
            )}
          >
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

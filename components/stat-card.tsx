import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  valueClassName?: string;
  className?: string;
  icon?: ReactNode;
};

export function StatCard({
  label,
  value,
  hint,
  valueClassName,
  className,
  icon,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-1 overflow-hidden rounded-xl border border-line bg-paper p-5 shadow-sm transition-shadow duration-200 hover:shadow-md",
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
        {hint && <p className="text-sm text-ink/50 mt-1">{hint}</p>}
      </div>
    </div>
  );
}

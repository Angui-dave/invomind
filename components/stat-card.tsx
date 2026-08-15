import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  valueClassName?: string;
  className?: string;
};

export function StatCard({
  label,
  value,
  hint,
  valueClassName,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-sm border border-line bg-paper p-4 shadow-[0_1px_3px_rgba(22,33,62,0.04)]",
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-ink/55">
        {label}
      </p>
      <p className={cn("mt-2 text-2xl font-semibold text-ink", valueClassName)}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink/55">{hint}</p>}
    </div>
  );
}

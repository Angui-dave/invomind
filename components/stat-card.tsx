import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const iconToneClass = {
  default: "bg-muted/60 text-ink/55",
  ledger: "bg-ledger/12 text-ledger",
  brass: "bg-brass/12 text-brass",
  amber: "bg-amber/12 text-amber",
  brick: "bg-brick/12 text-brick",
} as const;

/** Pastel surface + left accent + square icon chip for analytics variant */
const analyticsTone = {
  default: {
    surface: "border-l-muted-foreground/40 bg-muted/50",
    icon: "bg-muted text-ink/55",
  },
  ledger: {
    surface: "border-l-ledger bg-ledger/10",
    icon: "bg-ledger/15 text-ledger",
  },
  brass: {
    surface: "border-l-brass bg-brass/10",
    icon: "bg-brass/15 text-brass",
  },
  amber: {
    surface: "border-l-amber bg-amber/10",
    icon: "bg-amber/15 text-amber",
  },
  brick: {
    surface: "border-l-brick bg-brick/10",
    icon: "bg-brick/15 text-brick",
  },
} as const;

type Tone = keyof typeof iconToneClass;

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: string;
  valueClassName?: string;
  className?: string;
  icon?: ReactNode;
  tone?: Tone;
  /** `analytics` = pastel + left bar + square icon (dashboard KPIs) */
  variant?: "default" | "analytics";
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
  variant = "default",
}: StatCardProps) {
  if (variant === "analytics") {
    const palette = analyticsTone[tone];
    return (
      <div
        className={cn(
          "relative flex flex-col gap-1 overflow-hidden rounded-xl border-0 border-l-4 px-3.5 py-2.5 shadow-sm",
          palette.surface,
          className,
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium leading-tight tracking-wide text-ink/55">
            {label}
          </p>
          {icon ? (
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-md",
                palette.icon,
              )}
            >
              {icon}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-0.5">
          <p
            className={cn(
              "text-xl font-bold leading-tight tracking-tight text-ink",
              valueClassName,
            )}
          >
            {value}
          </p>
          {(trend || hint) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {trend ? (
                <span className="text-[11px] font-medium leading-tight text-ink/50">
                  {trend}
                </span>
              ) : null}
              {hint ? (
                <p className="text-[11px] leading-tight text-ink/50">{hint}</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    );
  }

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

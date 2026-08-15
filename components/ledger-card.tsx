import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type LedgerCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Slight physical tilt for hero / pricing cards */
  tilt?: boolean | "left" | "right";
  /** Apply perforated top edge mask */
  perforated?: boolean;
  className?: string;
};

const tiltClass = {
  true: "rotate-[0.8deg]",
  left: "-rotate-[0.9deg]",
  right: "rotate-[1.1deg]",
} as const;

export function LedgerCard({
  children,
  tilt = false,
  perforated = true,
  className,
  ...props
}: LedgerCardProps) {
  return (
    <div
      className={cn(
        "relative bg-paper text-ink border border-line",
        "shadow-[0_4px_14px_-2px_rgba(22,33,62,0.12),0_1px_3px_rgba(22,33,62,0.06)]",
        perforated && "ledger-perf pt-3",
        tilt && tiltClass[tilt === true ? "true" : tilt],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

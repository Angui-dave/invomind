import { cn } from "@/lib/utils";

const STEPS = [
  { key: "created", label: "Créée" },
  { key: "sent", label: "Envoyée" },
  { key: "viewed", label: "Vue" },
  { key: "reminded", label: "Relancée" },
  { key: "paid", label: "Payée" },
] as const;

type LifecycleStatus =
  | "draft"
  | "sent"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "accepted"
  | "refused"
  | "expired"
  | "cancelled"
  | string;

function activeIndex(status: LifecycleStatus, viewed?: boolean, reminded?: boolean) {
  if (status === "paid" || status === "accepted") return 4;
  if (status === "partially_paid" || status === "overdue" || reminded) return 3;
  if (viewed) return 2;
  if (status === "sent") return 1;
  return 0;
}

type DocumentLifecycleProps = {
  status: LifecycleStatus;
  viewed?: boolean;
  reminded?: boolean;
  className?: string;
};

export function DocumentLifecycle({
  status,
  viewed,
  reminded,
  className,
}: DocumentLifecycleProps) {
  const current = activeIndex(status, viewed, reminded);

  return (
    <ol className={cn("grid grid-cols-5 gap-1", className)}>
      {STEPS.map((step, index) => {
        const done = index <= current;
        return (
          <li key={step.key} className="min-w-0">
            <span
              className={cn(
                "block h-1.5 rounded-full",
                done ? "bg-ledger" : "bg-line",
              )}
            />
            <p
              className={cn(
                "mt-1.5 truncate text-[10px] font-medium",
                done ? "text-ink" : "text-ink/40",
              )}
            >
              {step.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

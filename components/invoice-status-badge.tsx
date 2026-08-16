"use client";

import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  draft: "bg-line/40 text-ink border-line",
  sent: "bg-brass/15 text-brass border-brass/40",
  accepted: "bg-ledger/15 text-ledger border-ledger/40",
  refused: "bg-brick/15 text-brick border-brick/40",
  expired: "bg-line/40 text-ink/60 border-line",
  partially_paid: "bg-brass/20 text-brass border-brass/50",
  paid: "bg-ledger/15 text-ledger border-ledger/40",
  overdue: "bg-brick/15 text-brick border-brick/40",
  cancelled: "bg-line/40 text-ink/50 border-line",
  issued: "bg-ledger/15 text-ledger border-ledger/40",
  applied: "bg-ink/10 text-ink border-ink/20",
};

type DocumentStatusBadgeProps = {
  status: string;
  className?: string;
};

export function InvoiceStatusBadge({
  status,
  className,
}: DocumentStatusBadgeProps) { 
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-sm font-sans text-xs font-medium",
        statusStyles[status] ?? "bg-line/40 text-ink border-line",
        className,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export { InvoiceStatusBadge as DocumentStatusBadge };

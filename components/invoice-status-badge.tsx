"use client";

import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/documents";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-line",
  sent: "bg-ledger/12 text-ledger border-ledger/30",
  accepted: "bg-brass/15 text-brass border-brass/40",
  refused: "bg-brick/15 text-brick border-brick/40",
  expired: "bg-muted text-muted-foreground border-line",
  partially_paid: "bg-amber/15 text-amber border-amber/40",
  paid: "bg-brass/15 text-brass border-brass/40",
  overdue: "bg-brick/15 text-brick border-brick/40",
  cancelled: "bg-muted text-muted-foreground border-line",
  issued: "bg-ledger/12 text-ledger border-ledger/30",
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
        "rounded-full font-sans text-xs font-medium",
        statusStyles[status] ?? "bg-line/40 text-ink border-line",
        className,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export { InvoiceStatusBadge as DocumentStatusBadge };

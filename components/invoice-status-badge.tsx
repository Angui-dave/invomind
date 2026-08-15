import { Badge } from "@/components/ui/badge";
import {
  STATUS_LABELS,
  type InvoiceStatus,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const statusStyles: Record<InvoiceStatus, string> = {
  draft: "bg-line/40 text-ink border-line",
  sent: "bg-brass/15 text-brass border-brass/40",
  paid: "bg-ledger/15 text-ledger border-ledger/40",
  overdue: "bg-brick/15 text-brick border-brick/40",
};

type InvoiceStatusBadgeProps = {
  status: InvoiceStatus;
  className?: string;
};

export function InvoiceStatusBadge({
  status,
  className,
}: InvoiceStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-sm font-sans text-xs font-medium",
        statusStyles[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

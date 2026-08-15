"use client";

import { Bell, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatDateFr,
  portalUrl,
  type Invoice,
} from "@/lib/mock-data";

type InvoiceTrackingCellProps = {
  invoice: Invoice;
};

export function InvoiceTrackingCell({ invoice }: InvoiceTrackingCellProps) {
  if (invoice.paidOnlineAt) {
    return (
      <Badge
        variant="outline"
        className="rounded-sm border-ledger/40 bg-ledger/10 text-ledger"
      >
        Payée en ligne
      </Badge>
    );
  }

  const sentReminder = invoice.reminders
    .filter((r) => r.state === "sent")
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const nextReminder = invoice.reminders
    .filter((r) => r.state === "scheduled")
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const reminderLabel = sentReminder
    ? `Relance envoyée le ${formatDateFr(sentReminder.date)}`
    : nextReminder
      ? `Prochaine relance le ${formatDateFr(nextReminder.date)}`
      : null;

  async function copyPortalLink() {
    const url = portalUrl(invoice.portalToken);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {invoice.remindersEnabled && reminderLabel && (
        <Tooltip>
          <TooltipTrigger
            className="inline-flex size-7 items-center justify-center rounded-sm text-ink/50 transition-ledger hover:bg-muted hover:text-ink"
            aria-label={reminderLabel}
          >
            <Bell className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent className="bg-ink text-paper border-ink">
            {reminderLabel}
          </TooltipContent>
        </Tooltip>
      )}
      <button
        type="button"
        onClick={copyPortalLink}
        className="inline-flex size-7 items-center justify-center rounded-sm text-ink/50 transition-ledger hover:bg-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label="Copier le lien du portail client"
      >
        <Link2 className="size-3.5" />
      </button>
    </div>
  );
}

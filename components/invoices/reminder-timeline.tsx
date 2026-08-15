"use client";

import { Bell, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  formatDateFr,
  REMINDER_MILESTONE_LABELS,
  type ReminderMilestone,
  type ReminderMilestoneStatus,
} from "@/lib/mock-data";

type ReminderTimelineProps = {
  reminders: ReminderMilestoneStatus[];
  onToggle: (milestone: ReminderMilestone, enabled: boolean) => void;
  showHistory?: boolean;
};

export function ReminderTimeline({
  reminders,
  onToggle,
  showHistory = false,
}: ReminderTimelineProps) {
  return (
    <ol className="relative space-y-0 border-l border-line pl-4">
      {reminders.map((item) => {
        const enabled = item.state !== "disabled";
        return (
          <li key={item.milestone} className="relative pb-5 last:pb-0">
            <span
              className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border border-line bg-paper"
              aria-hidden
            />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">
                  {REMINDER_MILESTONE_LABELS[item.milestone]}
                </p>
                {showHistory && item.state === "sent" && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-ledger">
                    <Check className="size-3" aria-hidden />
                    Envoyée le {formatDateFr(item.date)}
                  </p>
                )}
                {showHistory && item.state === "scheduled" && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-ink/55">
                    <Bell className="size-3" aria-hidden />
                    Programmée le {formatDateFr(item.date)}
                  </p>
                )}
                {!showHistory && (
                  <p className="mt-0.5 num text-xs text-ink/50">
                    {formatDateFr(item.date)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor={`reminder-${item.milestone}`}
                  className="sr-only"
                >
                  Activer {REMINDER_MILESTONE_LABELS[item.milestone]}
                </Label>
                <Switch
                  id={`reminder-${item.milestone}`}
                  checked={enabled}
                  onCheckedChange={(checked) =>
                    onToggle(item.milestone, checked)
                  }
                  size="sm"
                />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

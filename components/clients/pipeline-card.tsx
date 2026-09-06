"use client";

import { UserPlus } from "lucide-react";
import { relativeDateFr } from "@/lib/formatters";
import { DEFAULT_CURRENCY, formatMoney } from "@/lib/money";
import { PIPELINE_STAGE_COLORS, PIPELINE_STAGES, type PipelineStage, type Prospect } from "@/lib/data/settings";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type PipelineCardProps = {
  prospect: Prospect;
  onConvert?: (prospect: Prospect) => void;
  onStageChange?: (id: string, stage: PipelineStage) => void;
};

const ALL_STAGES: { id: PipelineStage; label: string }[] = [
  ...PIPELINE_STAGES,
  { id: "inactif", label: "Inactif" },
];

export function PipelineCard({
  prospect,
  onConvert,
  onStageChange,
}: PipelineCardProps) {
  return (
    <article
      className={cn(
        "rounded-sm border border-line bg-paper p-3 shadow-[0_1px_2px_rgba(22,33,62,0.04)]",
      )}
      style={{
        borderLeftWidth: 3,
        borderLeftColor: PIPELINE_STAGE_COLORS[prospect.stage],
      }}
    >
      <h3 className="text-sm font-medium text-ink">{prospect.name}</h3>
      <p className="text-xs text-ink/55">{prospect.company}</p>
      <p className="num mt-2 text-sm font-semibold text-brass">
        {formatMoney(prospect.estimatedValue, DEFAULT_CURRENCY)}
      </p>
      <p className="mt-1 text-xs text-ink/50" suppressHydrationWarning>
        {relativeDateFr(prospect.lastInteractionAt)}
      </p>
      {onStageChange ? (
        <Select
          value={prospect.stage}
          onValueChange={(v) =>
            v && onStageChange(prospect.id, v as PipelineStage)
          }
        >
          <SelectTrigger className="mt-2 h-7 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_STAGES.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {prospect.stage !== "client" &&
        prospect.stage !== "inactif" &&
        onConvert && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3 h-7 w-full text-xs"
            onClick={() => onConvert(prospect)}
          >
            <UserPlus className="size-3" aria-hidden />
            Marquer comme client
          </Button>
        )}
    </article>
  );
}

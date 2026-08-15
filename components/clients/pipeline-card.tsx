"use client";

import { UserPlus } from "lucide-react";
import {
  formatEuro,
  PIPELINE_STAGE_COLORS,
  relativeDateFr,
  type Prospect,
} from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PipelineCardProps = {
  prospect: Prospect;
  onConvert?: (prospect: Prospect) => void;
};

export function PipelineCard({ prospect, onConvert }: PipelineCardProps) {
  return (
    <article
      className={cn(
        "rounded-sm border border-line bg-paper p-3 shadow-[0_1px_2px_rgba(22,33,62,0.04)]",
      )}
      style={{ borderLeftWidth: 3, borderLeftColor: PIPELINE_STAGE_COLORS[prospect.stage] }}
    >
      <h3 className="text-sm font-medium text-ink">{prospect.name}</h3>
      <p className="text-xs text-ink/55">{prospect.company}</p>
      <p className="num mt-2 text-sm font-semibold text-brass">
        {formatEuro(prospect.estimatedValue)}
      </p>
      <p className="mt-1 text-xs text-ink/50">
        {relativeDateFr(prospect.lastInteractionAt)}
      </p>
      {prospect.stage === "gagne" && onConvert && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-3 h-7 w-full text-xs"
          onClick={() => onConvert(prospect)}
        >
          <UserPlus className="size-3" aria-hidden />
          Convertir en client
        </Button>
      )}
    </article>
  );
}

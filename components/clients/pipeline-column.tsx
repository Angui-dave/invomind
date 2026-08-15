import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PipelineCard } from "@/components/clients/pipeline-card";
import type { Prospect } from "@/lib/mock-data";

type PipelineColumnProps = {
  title: string;
  prospects: Prospect[];
  showAdd?: boolean;
  onAdd?: () => void;
  onConvert?: (prospect: Prospect) => void;
  footer?: ReactNode;
};

export function PipelineColumn({
  title,
  prospects,
  showAdd,
  onAdd,
  onConvert,
}: PipelineColumnProps) {
  return (
    <div className="flex w-[220px] shrink-0 flex-col rounded-sm border border-line bg-muted/40">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/70">
          {title}
        </h3>
        <span className="num text-xs text-ink/45">{prospects.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2">
        {showAdd && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 justify-start border-dashed text-xs"
            onClick={onAdd}
          >
            <Plus className="size-3.5" aria-hidden />
            Ajouter un prospect
          </Button>
        )}
        {prospects.map((prospect) => (
          <PipelineCard
            key={prospect.id}
            prospect={prospect}
            onConvert={onConvert}
          />
        ))}
      </div>
    </div>
  );
}

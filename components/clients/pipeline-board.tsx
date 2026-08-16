"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ClientDialog } from "@/components/clients/client-dialog";
import { PipelineCard } from "@/components/clients/pipeline-card";
import { PipelineColumn } from "@/components/clients/pipeline-column";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/actions/clients";
import { createProspect } from "@/lib/actions/prospects";
import {
  PIPELINE_STAGES,
  TODAY,
  type PipelineStage,
  type Prospect,
} from "@/lib/mock-data";
import { toast } from "sonner";

type PipelineBoardProps = {
  initialProspects?: Prospect[];
};

export function PipelineBoard({
  initialProspects = [],
}: PipelineBoardProps) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects);
  const [showLost, setShowLost] = useState(false);
  const [mobileStage, setMobileStage] = useState<PipelineStage>("nouveau");
  const [addOpen, setAddOpen] = useState(false);
  const [convertProspect, setConvertProspect] = useState<Prospect | null>(null);
  const [newName, setNewName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newValue, setNewValue] = useState("1000");
  const [newStage, setNewStage] = useState<Exclude<PipelineStage, "perdu">>("nouveau");

  const activeProspects = useMemo(
    () =>
      prospects.filter((p) =>
        showLost ? p.stage === "perdu" : p.stage !== "perdu",
      ),
    [prospects, showLost],
  );

  const byStage = (stage: PipelineStage) =>
    activeProspects.filter((p) => p.stage === stage);

  async function handleAddProspect() {
    if (newName.trim().length < 2) {
      toast.error("Le nom doit contenir au moins 2 caractères");
      return;
    }
    const value = Number(newValue) || 0;
    if (value <= 0) {
      toast.error("Le montant doit être supérieur à 0");
      return;
    }
    const result = await createProspect({
      name: newName.trim(),
      company: newCompany.trim() || "—",
      estimatedValue: value,
      stage: newStage,
      lastInteractionAt: TODAY,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const prospect: Prospect = {
      id: result.id!,
      name: newName.trim(),
      company: newCompany.trim() || "—",
      estimatedValue: value,
      stage: newStage,
      lastInteractionAt: TODAY,
    };
    setProspects((prev) => [prospect, ...prev]);
    setAddOpen(false);
    setNewName("");
    setNewCompany("");
    setNewValue("1000");
    setNewStage("nouveau");
    toast.success("Prospect ajouté");
  }

  const activeCount = prospects.filter((p) => p.stage !== "perdu").length;

  if (!showLost && activeCount === 0) {
    return (
      <div className="flex flex-col items-center rounded-sm border border-dashed border-line px-6 py-14 text-center">
        <h3 className="font-serif text-lg font-semibold text-ink">
          Aucun prospect pour l’instant
        </h3>
        <p className="mt-2 max-w-sm text-sm text-ink/60">
          Ajoutez un contact au pipeline pour suivre les opportunités avant la
          facturation.
        </p>
        <Button
          type="button"
          className="mt-5 bg-ledger text-paper hover:bg-ledger/90"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="size-4" aria-hidden />
          Ajouter mon premier prospect
        </Button>
        <ProspectDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          name={newName}
          company={newCompany}
          value={newValue}
          stage={newStage}
          onName={setNewName}
          onCompany={setNewCompany}
          onValue={setNewValue}
          onStage={setNewStage}
          onSubmit={handleAddProspect}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-ink/70">
          <Checkbox
            checked={showLost}
            onCheckedChange={(checked) => setShowLost(Boolean(checked))}
          />
          Afficher les perdus
        </label>
        <Button
          type="button"
          size="sm"
          className="bg-ledger text-paper hover:bg-ledger/90 md:hidden"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="size-3.5" aria-hidden />
          Ajouter un prospect
        </Button>
      </div>

      <div className="hidden gap-3 overflow-x-auto pb-2 md:flex">
        {showLost ? (
          <PipelineColumn title="Perdu" prospects={byStage("perdu")} />
        ) : (
          PIPELINE_STAGES.map((stage) => (
            <PipelineColumn
              key={stage.id}
              title={stage.label}
              prospects={byStage(stage.id)}
              showAdd={stage.id === "nouveau"}
              onAdd={() => setAddOpen(true)}
              onConvert={setConvertProspect}
            />
          ))
        )}
      </div>

      <div className="space-y-3 md:hidden">
        {!showLost && (
          <Select
            value={mobileStage}
            onValueChange={(value) =>
              value && setMobileStage(value as PipelineStage)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PIPELINE_STAGES.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="space-y-2">
          {(showLost ? byStage("perdu") : byStage(mobileStage)).map(
            (prospect) => (
              <PipelineCard
                key={prospect.id}
                prospect={prospect}
                onConvert={setConvertProspect}
              />
            ),
          )}
          {!showLost && byStage(mobileStage).length === 0 && (
            <p className="py-8 text-center text-sm text-ink/55">
              Aucun prospect dans cette étape.
            </p>
          )}
        </div>
      </div>

      <ProspectDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        name={newName}
        company={newCompany}
        value={newValue}
        stage={newStage}
        onName={setNewName}
        onCompany={setNewCompany}
        onValue={setNewValue}
        onStage={setNewStage}
        onSubmit={handleAddProspect}
      />

      <ClientDialog
        open={Boolean(convertProspect)}
        onOpenChange={(open) => {
          if (!open) setConvertProspect(null);
        }}
        initialValues={
          convertProspect
            ? {
                name: convertProspect.name,
                company: convertProspect.company,
                email: "",
                remindersEnabled: true,
              }
            : undefined
        }
        onSave={async (values) => {
          const result = await createClient(values);
          if (!result.ok) throw new Error(result.error);
          setConvertProspect(null);
        }}
      />
    </div>
  );
}

function ProspectDialog({
  open,
  onOpenChange,
  name,
  company,
  value,
  stage,
  onName,
  onCompany,
  onValue,
  onStage,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  company: string;
  value: string;
  stage: Exclude<PipelineStage, "perdu">;
  onName: (v: string) => void;
  onCompany: (v: string) => void;
  onValue: (v: string) => void;
  onStage: (v: Exclude<PipelineStage, "perdu">) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Ajouter un prospect</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="prs-name">Nom</Label>
            <Input
              id="prs-name"
              value={name}
              onChange={(e) => onName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prs-company">Entreprise</Label>
            <Input
              id="prs-company"
              value={company}
              onChange={(e) => onCompany(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prs-value">Valeur estimée (€)</Label>
            <Input
              id="prs-value"
              type="number"
              className="num"
              value={value}
              onChange={(e) => onValue(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Étape</Label>
            <Select
              value={stage}
              onValueChange={(v) =>
                v && onStage(v as Exclude<PipelineStage, "perdu">)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_STAGES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            className="bg-ledger text-paper hover:bg-ledger/90"
            onClick={onSubmit}
          >
            Ajouter le prospect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

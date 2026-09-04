"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
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
import {
  convertProspectToClient,
  createProspect,
  updateProspectStage,
} from "@/lib/actions/prospects";
import {
  PIPELINE_STAGES,
  TODAY,
  type PipelineStage,
  type Prospect,
} from "@/lib/mock-data";
import { toast } from "sonner";

type ActiveStage = Exclude<PipelineStage, "inactif">;

type PipelineBoardProps = {
  initialProspects?: Prospect[];
};

export function PipelineBoard({
  initialProspects = [],
}: PipelineBoardProps) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects);
  const [showInactive, setShowInactive] = useState(false);
  const [mobileStage, setMobileStage] = useState<PipelineStage>("prospect");
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newValue, setNewValue] = useState("0");
  const [newStage, setNewStage] = useState<ActiveStage>("prospect");

  const activeProspects = useMemo(
    () =>
      prospects.filter((p) =>
        showInactive ? p.stage === "inactif" : p.stage !== "inactif",
      ),
    [prospects, showInactive],
  );

  const byStage = (stage: PipelineStage) =>
    activeProspects.filter((p) => p.stage === stage);

  async function handleAddProspect() {
    if (newName.trim().length < 2) {
      toast.error("Le nom doit contenir au moins 2 caractères");
      return;
    }
    const value = Number(newValue) || 0;
    const result = await createProspect({
      name: newName.trim(),
      company: newCompany.trim() || newName.trim(),
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
      company: newCompany.trim() || newName.trim(),
      estimatedValue: value,
      stage: newStage,
      lastInteractionAt: TODAY,
    };
    setProspects((prev) => [prospect, ...prev]);
    setAddOpen(false);
    setNewName("");
    setNewCompany("");
    setNewValue("0");
    setNewStage("prospect");
    toast.success("Prospect ajouté");
  }

  async function handleStageChange(id: string, stage: PipelineStage) {
    const result = await updateProspectStage(id, stage);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setProspects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, stage, lastInteractionAt: TODAY }
          : p,
      ),
    );
    toast.success("Étape mise à jour");
  }

  async function handleConvert(prospect: Prospect) {
    const result = await convertProspectToClient(prospect.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setProspects((prev) =>
      prev.map((p) =>
        p.id === prospect.id
          ? { ...p, stage: "client", lastInteractionAt: TODAY }
          : p,
      ),
    );
    toast.success("Marqué comme client");
  }

  const activeCount = prospects.filter((p) => p.stage !== "inactif").length;

  if (!showInactive && activeCount === 0) {
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
            checked={showInactive}
            onCheckedChange={(checked) => setShowInactive(Boolean(checked))}
          />
          Afficher les inactifs
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
        {showInactive ? (
          <PipelineColumn
            title="Inactif"
            prospects={byStage("inactif")}
            onStageChange={handleStageChange}
          />
        ) : (
          PIPELINE_STAGES.map((stage) => (
            <PipelineColumn
              key={stage.id}
              title={stage.label}
              prospects={byStage(stage.id)}
              showAdd={stage.id === "prospect"}
              onAdd={() => setAddOpen(true)}
              onConvert={handleConvert}
              onStageChange={handleStageChange}
            />
          ))
        )}
      </div>

      <div className="space-y-3 md:hidden">
        {!showInactive && (
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
          {(showInactive ? byStage("inactif") : byStage(mobileStage)).map(
            (prospect) => (
              <PipelineCard
                key={prospect.id}
                prospect={prospect}
                onConvert={handleConvert}
                onStageChange={handleStageChange}
              />
            ),
          )}
          {!showInactive && byStage(mobileStage).length === 0 && (
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
  stage: ActiveStage;
  onName: (v: string) => void;
  onCompany: (v: string) => void;
  onValue: (v: string) => void;
  onStage: (v: ActiveStage) => void;
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
            <Label htmlFor="prs-value">Valeur estimée (XOF)</Label>
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
              onValueChange={(v) => v && onStage(v as ActiveStage)}
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

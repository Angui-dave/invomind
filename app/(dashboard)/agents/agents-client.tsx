"use client";

import { useState } from "react";
import { Plus, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createAgent,
  disableAgent,
  enableAgent,
} from "@/lib/actions/agents";
import type { AgentDto } from "@/lib/services/agent";

type AgentsPageClientProps = {
  agents: AgentDto[];
};

export function AgentsPageClient({ agents: initialAgents }: AgentsPageClientProps) {
  const [agents, setAgents] = useState<AgentDto[]>(initialAgents);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleCreate() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Tous les champs sont requis");
      return;
    }
    const result = await createAgent({ name, email, password });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setAgents((prev) => [
      ...prev,
      {
        id: result.id!,
        name,
        email,
        role: "member",
        status: "active",
        createdAt: new Date().toISOString(),
      },
    ]);
    setDialogOpen(false);
    setName("");
    setEmail("");
    setPassword("");
    toast.success("Agent créé avec succès");
  }

  async function handleToggleStatus(agent: AgentDto) {
    if (agent.status === "active") {
      const result = await disableAgent(agent.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, status: "disabled" } : a)),
      );
      toast.success("Agent désactivé");
    } else {
      const result = await enableAgent(agent.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, status: "active" } : a)),
      );
      toast.success("Agent réactivé");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">
            Gestion des agents
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            Invitez et gérez les sous-utilisateurs de votre organisation
          </p>
        </div>
        <Button
          type="button"
          className="rounded-full bg-ledger text-paper hover:bg-ledger/90"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="size-4" aria-hidden />
          Ajouter un agent
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Nom</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-ink/55"
                >
                  Aucun membre dans cette organisation.
                </TableCell>
              </TableRow>
            ) : (
              agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium text-ink">
                    {agent.name}
                  </TableCell>
                  <TableCell className="text-ink/70">{agent.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        agent.role === "owner" || agent.role === "admin"
                          ? "border-brass/40 bg-brass/12 text-brass"
                          : "border-line text-ink/60"
                      }
                    >
                      {agent.role === "owner"
                        ? "Propriétaire"
                        : agent.role === "admin"
                          ? "Admin"
                          : "Agent"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        agent.status === "active"
                          ? "border-ledger/40 bg-ledger/10 text-ledger"
                          : "border-brick/40 bg-brick/10 text-brick"
                      }
                    >
                      {agent.status === "active" ? "Actif" : "Désactivé"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {agent.role === "member" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title={
                          agent.status === "active"
                            ? "Désactiver"
                            : "Réactiver"
                        }
                        onClick={() => handleToggleStatus(agent)}
                      >
                        {agent.status === "active" ? (
                          <UserX className="size-4 text-brick" />
                        ) : (
                          <UserCheck className="size-4 text-ledger" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Prénom Nom"
              />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@entreprise.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mot de passe</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 caractères"
              />
            </div>
            <Button
              type="button"
              className="w-full bg-ledger text-paper hover:bg-ledger/90"
              onClick={handleCreate}
            >
              Créer l'agent
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

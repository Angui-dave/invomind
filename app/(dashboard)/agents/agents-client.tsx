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
  disableAgent,
  enableAgent,
  inviteAgent,
} from "@/lib/actions/agents";
import type { InvitationDto } from "@/lib/services/agent";
import type { AgentDto } from "@/lib/services/agent";

type AgentsPageClientProps = {
  agents: AgentDto[];
  invitations: InvitationDto[];
};

export function AgentsPageClient({
  agents: initialAgents,
  invitations: initialInvitations,
}: AgentsPageClientProps) {
  const [agents, setAgents] = useState<AgentDto[]>(initialAgents);
  const [invitations] = useState<InvitationDto[]>(initialInvitations);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  async function handleInvite() {
    if (!email.trim()) {
      toast.error("Indiquez l’e-mail du collègue");
      return;
    }
    setPending(true);
    const result = await inviteAgent({
      email: email.trim(),
      name: name.trim() || undefined,
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setAgents((prev) => [
      {
        id: result.id ?? `agent_${Date.now()}`,
        name: name.trim() || email.trim().split("@")[0] || "Agent",
        email: email.trim().toLowerCase(),
        role: "agent",
        status: "active",
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setCreatedPassword(result.temporaryPassword ?? null);
    setDialogOpen(false);
    setEmail("");
    setName("");
    toast.success(
      result.temporaryPassword
        ? "Agent créé — communiquez-lui le mot de passe temporaire"
        : "Agent créé",
    );
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
            Créez des comptes agents pour votre équipe. Un mot de passe
            temporaire est généré à la création.
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

      {createdPassword ? (
        <div className="rounded-2xl border border-brass/35 bg-brass/10 px-4 py-3 text-sm text-ink">
          Mot de passe temporaire à transmettre à l’agent :{" "}
          <code className="font-mono font-semibold">{createdPassword}</code>
        </div>
      ) : null}

      {invitations.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <p className="border-b border-line px-4 py-3 text-sm font-medium text-ink">
            Invitations en attente
          </p>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>E-mail</TableHead>
                <TableHead>Rôle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="text-ink/80">{invitation.email}</TableCell>
                  <TableCell className="text-ink/60">
                    {invitation.role === "admin" ? "Admin" : "Agent"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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
                  Aucun agent dans cette organisation.
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
                      className="border-line text-ink/60"
                    >
                      Agent
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      title={
                        agent.status === "active" ? "Désactiver" : "Réactiver"
                      }
                      onClick={() => handleToggleStatus(agent)}
                    >
                      {agent.status === "active" ? (
                        <UserX className="size-4 text-brick" />
                      ) : (
                        <UserCheck className="size-4 text-ledger" />
                      )}
                    </Button>
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
            <DialogTitle>Ajouter un agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-ink/65">
              Le compte est créé immédiatement. Un mot de passe temporaire vous
              sera affiché une seule fois.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="invite-name">Nom</Label>
              <Input
                id="invite-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Awa Diallo"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">E-mail</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@entreprise.com"
              />
            </div>
            <Button
              type="button"
              className="w-full bg-ledger text-paper hover:bg-ledger/90"
              disabled={pending}
              onClick={() => void handleInvite()}
            >
              {pending ? "Création…" : "Créer l’agent"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

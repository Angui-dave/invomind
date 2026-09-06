"use client";

import { useState } from "react";
import { Link2, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { ClientDialog, type ClientFormValues } from "@/components/clients/client-dialog";
import { PipelineBoard } from "@/components/clients/pipeline-board";
import { PageEmptyState } from "@/components/dashboard/page-empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient, updateClient } from "@/lib/actions/clients";
import { clientDisplayName, clientInitials, portalUrl, type Client } from "@/lib/data/clients";
import type { Prospect } from "@/lib/data/settings";

type ClientsPageClientProps = {
  initialClients: Client[];
  initialProspects: Prospect[];
  invoiceCounts: Record<string, number>;
  portalTokens: Record<string, string | null>;
  pipelineAllowed?: boolean;
};

export function ClientsPageClient({
  initialClients,
  initialProspects,
  invoiceCounts,
  portalTokens,
  pipelineAllowed = true,
}: ClientsPageClientProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  async function copyClientPortal(client: Client) {
    const token = portalTokens[client.id];
    if (!token) {
      toast.error("Aucune facture ouverte pour ce client");
      return;
    }
    try {
      await navigator.clipboard.writeText(portalUrl(token));
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  }

  async function handleSave(values: ClientFormValues) {
    if (editing) {
      const result = await updateClient(editing.id, values);
      if (!result.ok) throw new Error(result.error);
      setClients((prev) =>
        prev.map((c) => (c.id === editing.id ? { ...c, ...values } : c)),
      );
    } else {
      const result = await createClient(values);
      if (!result.ok) throw new Error(result.error);
      setClients((prev) => [
        {
          id: result.id!,
          ...values,
          portalToken: `cli-pending`,
        },
        ...prev,
      ]);
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="clients">
        <TabsList variant="line">
          <TabsTrigger value="clients">Clients</TabsTrigger>
          {pipelineAllowed ? (
            <TabsTrigger value="prospects">Prospects</TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="clients" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              type="button"
              className="rounded-full bg-ledger text-paper hover:bg-ledger/90"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" aria-hidden />
              Ajouter un client
            </Button>
          </div>

          {clients.length === 0 ? (
            <PageEmptyState
              icon={Users}
              title="Aucun client"
              description="Ajoutez votre premier client pour facturer et suivre les échanges."
              action={
                <Button
                  type="button"
                  className="rounded-full bg-ledger text-paper hover:bg-ledger/90"
                  onClick={() => {
                    setEditing(null);
                    setDialogOpen(true);
                  }}
                >
                  <Plus className="size-4" aria-hidden />
                  Ajouter un client
                </Button>
              }
            />
          ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Client</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead className="text-right">Factures</TableHead>
                  <TableHead>Relances</TableHead>
                  <TableHead className="text-right">Portail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="flex items-center gap-3 text-left transition-ledger hover:opacity-80"
                        onClick={() => {
                          setEditing(client);
                          setDialogOpen(true);
                        }}
                      >
                        <Avatar size="sm">
                          <AvatarFallback className="bg-muted text-ink">
                            {clientInitials(clientDisplayName(client))}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          <span className="block font-medium text-ink">
                            {clientDisplayName(client)}
                          </span>
                          {client.name &&
                          client.name !== client.company ? (
                            <span className="block text-xs text-ink/55">
                              {client.name}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="text-ink/70">{client.email}</TableCell>
                    <TableCell className="num text-right">
                      {invoiceCounts[client.id] ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          client.remindersEnabled
                            ? "border-ledger/40 bg-ledger/10 text-ledger"
                            : "border-line text-ink/55"
                        }
                      >
                        {client.remindersEnabled
                          ? "Relances activées"
                          : "Relances désactivées"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={() => copyClientPortal(client)}
                        className="inline-flex size-7 items-center justify-center rounded-sm text-ink/50 transition-ledger hover:bg-muted hover:text-ink"
                        aria-label={`Copier le lien portail de ${client.name}`}
                      >
                        <Link2 className="size-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}
        </TabsContent>

        {pipelineAllowed ? (
          <TabsContent value="prospects" className="mt-4">
            <PipelineBoard initialProspects={initialProspects} />
          </TabsContent>
        ) : null}
      </Tabs>

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editing}
        onSave={handleSave}
      />
    </div>
  );
}

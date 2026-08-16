"use client";

import { useState } from "react";
import { Link2, Plus } from "lucide-react";
import { toast } from "sonner";
import { ClientDialog } from "@/components/clients/client-dialog";
import { PipelineBoard } from "@/components/clients/pipeline-board";
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
import {
  CLIENTS,
  clientInitials,
  invoiceCountFor,
  latestOpenInvoiceToken,
  portalUrl,
  type Client,
} from "@/lib/mock-data";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(CLIENTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  async function copyClientPortal(client: Client) {
    const token = latestOpenInvoiceToken(client.id);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">
            Clients
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            Base clients et pipeline prospects
          </p>
        </div>
      </div>

      <Tabs defaultValue="clients">
        <TabsList variant="line">
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="prospects">Prospects</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              type="button"
              className="bg-ledger text-paper hover:bg-ledger/90"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" aria-hidden />
              Ajouter un client
            </Button>
          </div>

          <div className="rounded-sm border border-line bg-paper">
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
                            {clientInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          <span className="block font-medium text-ink">
                            {client.name}
                          </span>
                          <span className="block text-xs text-ink/55">
                            {client.company}
                          </span>
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="text-ink/70">{client.email}</TableCell>
                    <TableCell className="num text-right">
                      {invoiceCountFor(client.id)}
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
        </TabsContent>

        <TabsContent value="prospects" className="mt-4">
          <PipelineBoard />
        </TabsContent>
      </Tabs>

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editing}
        onSave={(values) => {
          if (editing) {
            setClients((prev) =>
              prev.map((c) =>
                c.id === editing.id
                  ? {
                      ...c,
                      ...values,
                    }
                  : c,
              ),
            );
          } else {
            setClients((prev) => [
              {
                id: `cli_${Math.random().toString(36).slice(2, 8)}`,
                ...values,
                portalToken: `cli-${values.name.toLowerCase().replace(/\s+/g, "-")}`,
              },
              ...prev,
            ]);
          }
        }}
      />
    </div>
  );
}

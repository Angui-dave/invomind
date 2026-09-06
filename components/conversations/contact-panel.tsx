"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FilePlus2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { ChannelBadge } from "@/components/conversations/channel-badge";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { linkConversationClient } from "@/lib/actions/conversations";
import { createClient } from "@/lib/actions/clients";
import type { Client } from "@/lib/data/clients";
import {
  PIPELINE_STAGE_COLORS,
  PIPELINE_STAGES,
  type Prospect,
} from "@/lib/data/settings";
import { DEFAULT_CURRENCY, formatMoney } from "@/lib/money";
import type { BusinessDocument } from "@/lib/documents";
import { resolveContact, type Conversation } from "@/lib/data/conversations";
import { cn } from "@/lib/utils";

type ContactPanelProps = {
  conversation: Conversation | null;
  clients?: Client[];
  prospects?: Prospect[];
  invoices?: BusinessDocument[];
  laravelEnabled?: boolean;
  onClientLinked?: (clientId: string | null) => void;
  className?: string;
};

const OPEN_STATUSES = new Set(["sent", "partially_paid", "overdue"]);

export function ContactPanel({
  conversation,
  clients = [],
  prospects = [],
  invoices = [],
  laravelEnabled = false,
  onClientLinked,
  className,
}: ContactPanelProps) {
  const [linking, setLinking] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const contact = useMemo(
    () =>
      conversation
        ? resolveContact(conversation, clients, prospects)
        : ({ kind: "unknown" } as const),
    [conversation, clients, prospects],
  );

  if (!conversation) {
    return (
      <aside
        className={cn(
          "flex h-full items-center justify-center bg-paper px-4 text-center",
          className,
        )}
      >
        <p className="text-sm text-ink/50">
          La fiche contact apparaîtra ici.
        </p>
      </aside>
    );
  }

  const openInvoices =
    contact.kind === "client"
      ? invoices.filter(
          (inv) =>
            inv.clientId === contact.client.id &&
            OPEN_STATUSES.has(inv.status),
        )
      : [];

  const stageLabel =
    contact.kind === "prospect"
      ? (PIPELINE_STAGES.find((s) => s.id === contact.prospect.stage)?.label ??
        contact.prospect.stage)
      : null;

  async function associateClient(clientId: string) {
    if (!laravelEnabled) {
      toast.success("Association simulée — activez Laravel pour persister");
      return;
    }
    setLinking(true);
    const result = await linkConversationClient({
      conversationId: conversation!.id,
      clientId,
    });
    setLinking(false);
    if (result.ok) {
      toast.success("Contact associé au client");
      onClientLinked?.(clientId);
    } else {
      toast.error(result.error);
    }
  }

  async function createAndLink() {
    if (!laravelEnabled) {
      toast.error("API Laravel requise");
      return;
    }
    setLinking(true);
    const created = await createClient({
      name: conversation!.contactName,
      company: conversation!.contactName,
      email: `contact+${conversation!.id.replace(/\W/g, "")}@invomind.local`,
      phone: conversation!.contactHandle,
      remindersEnabled: true,
    });
    if (!created.ok || !created.id) {
      setLinking(false);
      toast.error(created.ok ? "Client créé sans id" : created.error);
      return;
    }
    const linked = await linkConversationClient({
      conversationId: conversation!.id,
      clientId: created.id,
    });
    setLinking(false);
    if (linked.ok) {
      toast.success("Client créé et associé");
      onClientLinked?.(created.id);
    } else {
      toast.error(linked.error);
    }
  }

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col overflow-y-auto bg-paper",
        className,
      )}
    >
      <div className="space-y-4 p-4">
        <div>
          <ChannelBadge channel={conversation.channel} className="mb-3" />
          <h2 className="font-serif text-lg font-semibold tracking-tight text-ink uppercase">
            {contact.kind === "client"
              ? contact.client.company
              : contact.kind === "prospect"
                ? contact.prospect.company
                : conversation.contactName}
          </h2>
          <p className="mt-0.5 text-sm text-ink/60">
            {contact.kind === "client"
              ? contact.client.name
              : contact.kind === "prospect"
                ? contact.prospect.name
                : conversation.contactHandle}
          </p>
          <p className="mt-1 font-mono text-xs text-ink/45">
            {conversation.contactHandle}
          </p>
        </div>

        {contact.kind === "client" && (
          <Badge
            variant="outline"
            className="rounded-sm border-brass/40 bg-brass/12 text-brass"
          >
            Client
          </Badge>
        )}

        {contact.kind === "prospect" && (
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="rounded-sm font-sans text-xs"
              style={{
                borderColor: PIPELINE_STAGE_COLORS[contact.prospect.stage],
                color: PIPELINE_STAGE_COLORS[contact.prospect.stage],
                backgroundColor: `${PIPELINE_STAGE_COLORS[contact.prospect.stage]}18`,
              }}
            >
              Prospect · {stageLabel}
            </Badge>
            <p className="text-xs text-ink/50">Valeur estimée</p>
            <p className="num text-base font-semibold text-brass">
              {formatMoney(
                contact.prospect.estimatedValue,
                DEFAULT_CURRENCY,
              )}
            </p>
          </div>
        )}

        {contact.kind === "unknown" && (
          <div className="space-y-3 rounded-sm border border-dashed border-line bg-muted/30 p-3">
            <p className="text-sm font-medium text-ink">Contact non rattaché</p>
            <p className="text-xs text-ink/55">
              Associez ce profil à un client ou créez-en un pour synchroniser
              les factures.
            </p>
            {clients.length > 0 ? (
              <div className="flex gap-2">
                <Select
                  value={selectedClientId}
                  onValueChange={setSelectedClientId}
                >
                  <SelectTrigger className="h-9 flex-1">
                    <SelectValue placeholder="Choisir un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.company || c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  disabled={!selectedClientId || linking}
                  onClick={() => void associateClient(selectedClientId)}
                >
                  Lier
                </Button>
              </div>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              disabled={linking}
              onClick={() => void createAndLink()}
            >
              <UserPlus className="size-3.5" aria-hidden />
              Créer un client
            </Button>
          </div>
        )}

        <Separator />

        <div>
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-ink/45">
            Factures en cours
          </h3>
          {contact.kind !== "client" ? (
            <p className="mt-2 text-xs text-ink/50">
              Disponible une fois le contact associé à un client.
            </p>
          ) : openInvoices.length === 0 ? (
            <p className="mt-2 text-xs text-ink/50">Aucune facture ouverte.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {openInvoices.map((invoice) => (
                <li key={invoice.id}>
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="flex items-center justify-between gap-2 rounded-sm border border-line px-2.5 py-2 transition-ledger hover:bg-muted/40"
                  >
                    <span>
                      <span className="block text-sm font-medium text-ink">
                        {invoice.number}
                      </span>
                      <span className="num text-xs text-ink/55">
                        {formatMoney(invoice.total, invoice.currency)}
                      </span>
                    </span>
                    <InvoiceStatusBadge status={invoice.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          {contact.kind === "client" && (
            <>
              <Link
                href="/invoices/new"
                className={cn(
                  buttonVariants(),
                  "w-full bg-ledger text-paper hover:bg-ledger/90",
                )}
              >
                <FilePlus2 className="size-4" aria-hidden />
                Créer une facture
              </Link>
              <Link
                href="/clients"
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              >
                <Users className="size-4" aria-hidden />
                Voir la fiche client
              </Link>
            </>
          )}

          {contact.kind === "prospect" && (
            <>
              <Button
                type="button"
                className="w-full bg-ledger text-paper hover:bg-ledger/90"
                disabled={linking}
                onClick={() => void createAndLink()}
              >
                <UserPlus className="size-4" aria-hidden />
                Convertir en client
              </Button>
              <Link
                href="/invoices/new"
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              >
                <FilePlus2 className="size-4" aria-hidden />
                Créer une facture
              </Link>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

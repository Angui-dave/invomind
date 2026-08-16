"use client";

import Link from "next/link";
import { FilePlus2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { ChannelBadge } from "@/components/conversations/channel-badge";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  getInvoices,
  PIPELINE_STAGE_COLORS,
  PIPELINE_STAGES,
  resolveContact,
  type Conversation,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type ContactPanelProps = {
  conversation: Conversation | null;
  className?: string;
};

const OPEN_STATUSES = new Set(["sent", "partially_paid", "overdue"]);

export function ContactPanel({ conversation, className }: ContactPanelProps) {
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

  const contact = resolveContact(conversation);
  const openInvoices =
    contact.kind === "client"
      ? getInvoices().filter(
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
          <div className="rounded-sm border border-dashed border-line bg-muted/30 p-3">
            <p className="text-sm font-medium text-ink">Contact non rattaché</p>
            <p className="mt-1 text-xs text-ink/55">
              Associez ce profil à un client ou créez-en un pour synchroniser
              les factures.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() =>
                toast.success("Association simulée — à brancher au CRM")
              }
            >
              <UserPlus className="size-3.5" aria-hidden />
              Associer à un client
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
                onClick={() =>
                  toast.success(
                    `${contact.prospect.name} converti(e) en client`,
                  )
                }
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

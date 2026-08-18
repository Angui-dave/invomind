"use client";

import { useMemo, useState } from "react";
import { Plus, Search, UserRound } from "lucide-react";
import {
  ClientDialog,
  type ClientFormValues,
} from "@/components/clients/client-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/actions/clients";
import type { Client } from "@/lib/data/clients";
import { CURRENCIES, type CurrencyCode } from "@/lib/money";
import { TAX_PRESETS } from "@/lib/tax";
import { cn } from "@/lib/utils";

export function formatClientLabel(client: Client) {
  const name = client.name.trim();
  const company = client.company.trim();
  if (name && company && name !== company) return `${name} — ${company}`;
  return name || company || "Client";
}

type ClientPickerProps = {
  clients: Client[];
  clientId: string;
  error?: string;
  onSelect: (client: Client) => void;
  onClientsChange: (clients: Client[]) => void;
};

export function ClientPicker({
  clients,
  clientId,
  error,
  onSelect,
  onClientsChange,
}: ClientPickerProps) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const client = clients.find((item) => item.id === clientId);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter((item) =>
      [item.name, item.company, item.email]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [clients, query]);

  async function handleCreate(values: ClientFormValues) {
    const result = await createClient(values);
    if (!result.ok || !result.id) {
      throw new Error(result.ok ? "Client introuvable" : result.error);
    }
    const created: Client = {
      id: result.id,
      name: values.name,
      company: values.company,
      email: values.email,
      phone: values.phone,
      address: values.address,
      city: values.city,
      postalCode: values.postalCode,
      country: values.country,
      taxId: values.taxId,
      currency: values.currency,
      paymentTermDays: values.paymentTermDays,
      remindersEnabled: values.remindersEnabled,
      portalToken: `cli-${result.id.slice(0, 12)}`,
    };
    onClientsChange([created, ...clients]);
    onSelect(created);
  }

  return (
    <div id="field-client" className="space-y-3">
      <button
        type="button"
        aria-invalid={error ? true : undefined}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-lg border bg-transparent px-3 py-2 text-left text-sm transition-ledger hover:bg-muted/40",
          error ? "border-brick/50" : "border-input",
        )}
        onClick={() => setOpen(true)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <UserRound className="size-4 shrink-0 text-ink/45" aria-hidden />
          <span className={cn("truncate", !client && "text-ink/45")}>
            {client ? formatClientLabel(client) : "Choisir un client"}
          </span>
        </span>
        <span className="shrink-0 text-xs text-ink/45">Changer</span>
      </button>

      {error ? (
        <p className="text-sm text-brick" role="alert">
          {error}
        </p>
      ) : null}

      {client ? <ClientSummary client={client} /> : null}

      {clients.length === 0 && (
        <p className="text-sm text-ink/55">
          Aucun client pour le moment. Créez-en un pour adresser ce devis.
        </p>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Destinataire</DialogTitle>
            <DialogDescription>
              Recherchez un client existant ou créez-en un sans quitter le
              devis.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink/40"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
              placeholder="Nom, société ou e-mail"
              className="pl-8"
              autoFocus
            />
          </div>
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-2 py-6 text-center text-sm text-ink/50">
                Aucun résultat
              </li>
            ) : (
              filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full flex-col rounded-lg px-3 py-2 text-left transition-ledger hover:bg-muted/60",
                      item.id === clientId && "bg-ledger/8",
                    )}
                    onClick={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
                  >
                    <span className="font-medium text-ink">
                      {formatClientLabel(item)}
                    </span>
                    <span className="text-xs text-ink/50">{item.email}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
              setCreateOpen(true);
            }}
          >
            <Plus className="size-3.5" aria-hidden />
            Nouveau client
          </Button>
        </DialogContent>
      </Dialog>

      <ClientDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={handleCreate}
      />
    </div>
  );
}

function ClientSummary({ client }: { client: Client }) {
  const country =
    TAX_PRESETS.find((preset) => preset.countryCode === client.country)
      ?.countryLabel ?? client.country;
  const currency = client.currency
    ? CURRENCIES[client.currency as CurrencyCode]?.code
    : null;
  const location = [client.postalCode, client.city, country]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rounded-xl border border-line/80 bg-muted/30 px-3 py-2.5 text-sm">
      <p className="font-medium text-ink">{formatClientLabel(client)}</p>
      {client.address ? (
        <p className="mt-0.5 text-ink/65">{client.address}</p>
      ) : null}
      {location ? <p className="text-ink/65">{location}</p> : null}
      <p className="mt-1 text-xs text-ink/50">
        {client.email}
        {client.taxId ? ` · NINEA ${client.taxId}` : ""}
        {currency ? ` · ${currency}` : ""}
      </p>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { LedgerCard } from "@/components/ledger-card";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { PaymentLinkButton } from "@/components/invoices/payment-link-button";
import { ReminderTimeline } from "@/components/invoices/reminder-timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CLIENTS,
  CURRENT_USER,
  formatDateFr,
  formatEuro,
  PAYMENT_METHOD_LABELS,
  portalUrl,
  REMINDER_DEFAULTS,
  type Invoice,
  type InvoiceLine,
  type ReminderMilestone,
  type ReminderMilestoneStatus,
} from "@/lib/mock-data";
import { toast } from "sonner";

type InvoiceFormProps = {
  mode: "new" | "edit";
  invoice?: Invoice;
};

function createDefaultReminders(): ReminderMilestoneStatus[] {
  const base = new Date("2026-09-12");
  const offsets: Record<ReminderMilestone, number> = {
    "J-3": -3,
    "J+3": 3,
    "J+7": 7,
    "J+14": 14,
  };
  return REMINDER_DEFAULTS.map((milestone) => {
    const date = new Date(base);
    date.setDate(date.getDate() + offsets[milestone]);
    return {
      milestone,
      state: "scheduled" as const,
      date: date.toISOString().slice(0, 10),
    };
  });
}

function emptyLine(): InvoiceLine {
  return {
    id: `line_${Math.random().toString(36).slice(2, 8)}`,
    description: "",
    quantity: 1,
    unitPrice: 0,
  };
}

export function InvoiceForm({ mode, invoice }: InvoiceFormProps) {
  const router = useRouter();
  const [clientId, setClientId] = useState(invoice?.clientId ?? CLIENTS[0]?.id ?? "");
  const [lines, setLines] = useState<InvoiceLine[]>(
    invoice?.lines ?? [
      {
        id: "line_1",
        description: "Prestation",
        quantity: 1,
        unitPrice: 0,
      },
    ],
  );
  const [onlinePayment, setOnlinePayment] = useState(
    invoice?.onlinePaymentEnabled ?? true,
  );
  const [reminders, setReminders] = useState<ReminderMilestoneStatus[]>(
    invoice?.reminders ?? createDefaultReminders(),
  );
  const [paymentTab, setPaymentTab] = useState("card");

  const client = CLIENTS.find((c) => c.id === clientId);
  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
    [lines],
  );

  function updateLine(id: string, patch: Partial<InvoiceLine>) {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  }

  function toggleReminder(milestone: ReminderMilestone, enabled: boolean) {
    setReminders((prev) =>
      prev.map((item) =>
        item.milestone === milestone
          ? {
              ...item,
              state: enabled
                ? item.state === "sent"
                  ? "sent"
                  : "scheduled"
                : "disabled",
            }
          : item,
      ),
    );
  }

  function handleSave() {
    toast.success(mode === "new" ? "Facture créée" : "Facture enregistrée");
    router.push("/invoices");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">
            {mode === "new" ? "Nouvelle facture" : `Facture ${invoice?.number}`}
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            {mode === "new"
              ? "Remplissez les lignes : l’aperçu se met à jour en direct."
              : "Modifiez les détails, les relances et le paiement en ligne."}
          </p>
        </div>
        {mode === "edit" && invoice && (
          <InvoiceStatusBadge status={invoice.status} />
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <section className="space-y-3 rounded-sm border border-line bg-paper p-4">
            <Label htmlFor="client">Client</Label>
            <Select value={clientId} onValueChange={(value) => value && setClientId(value)}>
              <SelectTrigger id="client" className="w-full">
                <SelectValue placeholder="Choisir un client" />
              </SelectTrigger>
              <SelectContent>
                {CLIENTS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} — {c.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          <section className="space-y-3 rounded-sm border border-line bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-base font-semibold text-ink">
                Lignes de facturation
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLines((prev) => [...prev, emptyLine()])}
              >
                <Plus className="size-3.5" aria-hidden />
                Ajouter une ligne
              </Button>
            </div>
            <ul className="space-y-3">
              {lines.map((line) => (
                <li
                  key={line.id}
                  className="grid gap-2 rounded-sm border border-line/70 p-3 sm:grid-cols-[1fr_72px_96px_auto]"
                >
                  <div>
                    <Label className="sr-only">Description</Label>
                    <Input
                      value={line.description}
                      onChange={(e) =>
                        updateLine(line.id, { description: e.target.value })
                      }
                      placeholder="Description"
                    />
                  </div>
                  <div>
                    <Label className="sr-only">Quantité</Label>
                    <Input
                      type="number"
                      min={0}
                      className="num"
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(line.id, {
                          quantity: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="sr-only">Prix unitaire</Label>
                    <Input
                      type="number"
                      min={0}
                      className="num"
                      value={line.unitPrice}
                      onChange={(e) =>
                        updateLine(line.id, {
                          unitPrice: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-ink/50 hover:text-brick"
                    disabled={lines.length <= 1}
                    onClick={() =>
                      setLines((prev) => prev.filter((l) => l.id !== line.id))
                    }
                    aria-label="Supprimer la ligne"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
            <p className="flex items-center justify-between border-t border-line pt-3 text-sm">
              <span className="text-ink/60">Total TTC</span>
              <span className="num text-lg font-semibold text-brass">
                {formatEuro(total)}
              </span>
            </p>
          </section>

          <section className="space-y-4 rounded-sm border border-line bg-paper p-4">
            <h2 className="font-serif text-base font-semibold text-ink">
              Relances automatiques
            </h2>
            <ReminderTimeline
              reminders={reminders}
              onToggle={toggleReminder}
              showHistory={mode === "edit" && invoice?.status !== "draft"}
            />
          </section>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <LedgerCard className="overflow-hidden">
            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-base font-semibold text-ink">
                    {CURRENT_USER.company}
                  </p>
                  <p className="text-xs text-ink/55">{CURRENT_USER.email}</p>
                </div>
                {invoice && <InvoiceStatusBadge status={invoice.status} />}
              </div>
              <div className="border-t border-dashed border-line pt-3">
                <p className="text-xs uppercase tracking-wide text-ink/50">
                  Facture
                </p>
                <p className="num mt-0.5 text-sm font-medium">
                  {invoice?.number ?? "FAC-2026-015"}
                </p>
                <p className="mt-1 text-sm text-ink/70">
                  Pour {client?.name ?? "—"}
                </p>
                {invoice && (
                  <p className="num mt-0.5 text-xs text-ink/50">
                    Échéance {formatDateFr(invoice.dueDate)}
                  </p>
                )}
              </div>
              <ul className="space-y-2 border-t border-line pt-3">
                {lines.map((line) => (
                  <li
                    key={line.id}
                    className="flex items-baseline justify-between gap-3 text-sm"
                  >
                    <span className="truncate text-ink/80">
                      {line.description || "Ligne"}
                    </span>
                    <span className="num shrink-0">
                      {formatEuro(line.quantity * line.unitPrice)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex items-end justify-between border-t border-line pt-3">
                <span className="text-sm text-ink/65">Total TTC</span>
                <span className="num text-2xl font-semibold text-brass">
                  {formatEuro(total)}
                </span>
              </div>
            </div>
          </LedgerCard>

          <section className="space-y-3 rounded-sm border border-line bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-base font-semibold text-ink">
                  Paiement en ligne
                </h2>
                <p className="text-xs text-ink/55">
                  Affiche « Payer maintenant » sur le portail client
                </p>
              </div>
              <Switch
                checked={onlinePayment}
                onCheckedChange={setOnlinePayment}
                aria-label="Activer le paiement en ligne"
              />
            </div>

            {onlinePayment && (
              <>
                <div className="rounded-sm bg-ledger px-3 py-2.5 text-center text-sm font-medium text-paper">
                  Payer maintenant
                </div>
                <Tabs value={paymentTab} onValueChange={setPaymentTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="card" className="flex-1">
                      Carte bancaire
                    </TabsTrigger>
                    <TabsTrigger value="mobile_money" className="flex-1">
                      Mobile Money
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="card" className="text-xs text-ink/60">
                    Aperçu : formulaire carte tel que le client le verra.
                  </TabsContent>
                  <TabsContent
                    value="mobile_money"
                    className="text-xs text-ink/60"
                  >
                    Aperçu : saisie du numéro Mobile Money.
                  </TabsContent>
                </Tabs>
              </>
            )}
          </section>

          {mode === "edit" && invoice && (
            <section className="space-y-3 rounded-sm border border-line bg-paper p-4">
              {invoice.paidOnlineAt ? (
                <p className="rounded-sm border border-ledger/30 bg-ledger/10 px-3 py-2 text-sm text-ledger">
                  Payée en ligne le {formatDateFr(invoice.paidOnlineAt)}
                  {invoice.paymentMethod
                    ? ` via ${PAYMENT_METHOD_LABELS[invoice.paymentMethod]}`
                    : ""}
                </p>
              ) : onlinePayment ? (
                <p className="text-sm text-ink/70">
                  Lien de paiement actif — en attente
                </p>
              ) : (
                <p className="text-sm text-ink/55">
                  Paiement en ligne désactivé sur cette facture
                </p>
              )}
              <p className="num truncate text-xs text-ink/50">
                {portalUrl(invoice.portalToken)}
              </p>
              <PaymentLinkButton token={invoice.portalToken} className="w-full" />
            </section>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="bg-ledger text-paper hover:bg-ledger/90"
              onClick={handleSave}
            >
              {mode === "new" ? "Créer la facture" : "Enregistrer"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/invoices")}
            >
              Annuler
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

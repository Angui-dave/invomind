"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PackagePlus, Plus, Trash2 } from "lucide-react";
import { LedgerCard } from "@/components/ledger-card";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { PaymentLinkButton } from "@/components/invoices/payment-link-button";
import { ReminderTimeline } from "@/components/invoices/reminder-timeline";
import { PaymentQrSection } from "@/components/invoices/payment-qr-section";
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
  addDays,
  CATALOG_ITEMS,
  CLIENTS,
  CURRENCIES,
  DOCUMENTS,
  DOCUMENT_KIND_LABELS,
  emptyLine,
  formatDateFr,
  formatMoney,
  getTaxPreset,
  nextDocumentNumber,
  ORG_SETTINGS,
  PAYMENT_METHOD_LABELS,
  portalUrl,
  REMINDER_DEFAULTS,
  computeTotals,
  TODAY,
  type BusinessDocument,
  type CurrencyCode,
  type DocumentKind,
  type DocumentLine,
  type ReminderMilestone,
  type ReminderMilestoneStatus,
  type TaxMode,
} from "@/lib/mock-data";
import { toast } from "sonner";

type DocumentFormProps = {
  mode: "new" | "edit";
  kind?: DocumentKind;
  document?: BusinessDocument;
  /** When true, document was built from quote/credit conversion */
  prefilledFromConversion?: boolean;
};

function createDefaultReminders(dueDate: string): ReminderMilestoneStatus[] {
  const offsets: Record<ReminderMilestone, number> = {
    "J-3": -3,
    "J+3": 3,
    "J+7": 7,
    "J+14": 14,
  };
  return REMINDER_DEFAULTS.map((milestone) => ({
    milestone,
    state: "scheduled" as const,
    date: addDays(dueDate, offsets[milestone]),
  }));
}

export function InvoiceForm({
  mode,
  kind: kindProp,
  document,
  prefilledFromConversion = false,
}: DocumentFormProps) {
  const router = useRouter();
  const kind = document?.kind ?? kindProp ?? "invoice";
  const taxPreset = getTaxPreset(ORG_SETTINGS.country);
  const orgCurrency = ORG_SETTINGS.defaultCurrency;

  const initialClientId = document?.clientId ?? CLIENTS[0]?.id ?? "";
  const initialClient = CLIENTS.find((c) => c.id === initialClientId);
  const initialIssue = document?.issueDate ?? TODAY;
  const initialDue =
    document?.dueDate ??
    addDays(initialIssue, initialClient?.paymentTermDays ?? 30);

  const [clientId, setClientId] = useState(initialClientId);
  const [currency, setCurrency] = useState<CurrencyCode>(
    document?.currency ?? initialClient?.currency ?? orgCurrency,
  );
  const [taxMode, setTaxMode] = useState<TaxMode>(
    document?.taxMode ?? ORG_SETTINGS.defaultTaxMode,
  );
  const [issueDate, setIssueDate] = useState(initialIssue);
  const [dueDate, setDueDate] = useState(initialDue);
  const [lines, setLines] = useState<DocumentLine[]>(
    document?.lines ?? [
      {
        id: "line_1",
        description: "Prestation",
        quantity: 1,
        unitPrice: 0,
        taxRate: ORG_SETTINGS.defaultTaxRate,
      },
    ],
  );
  const [onlinePayment, setOnlinePayment] = useState(
    document?.onlinePaymentEnabled ?? kind === "invoice",
  );
  const [reminders, setReminders] = useState<ReminderMilestoneStatus[]>(
    document?.reminders?.length
      ? document.reminders
      : kind === "invoice"
        ? createDefaultReminders(initialDue)
        : [],
  );
  const [paymentTab, setPaymentTab] = useState("card");
  const [showCatalog, setShowCatalog] = useState(false);

  const client = CLIENTS.find((c) => c.id === clientId);
  const totals = useMemo(
    () => computeTotals(lines, taxMode),
    [lines, taxMode],
  );
  const previewNumber =
    document?.number ?? nextDocumentNumber(kind, DOCUMENTS);

  function selectClient(id: string) {
    setClientId(id);
    const next = CLIENTS.find((c) => c.id === id);
    if (next?.currency) setCurrency(next.currency);
    if (mode === "new" && !prefilledFromConversion && next?.paymentTermDays) {
      const nextDue = addDays(issueDate, next.paymentTermDays);
      setDueDate(nextDue);
      if (kind === "invoice") {
        setReminders(createDefaultReminders(nextDue));
      }
    }
  }

  function changeIssueDate(value: string) {
    setIssueDate(value);
    if (mode === "new" && !prefilledFromConversion) {
      const days = client?.paymentTermDays ?? 30;
      const nextDue = addDays(value, days);
      setDueDate(nextDue);
      if (kind === "invoice") {
        setReminders(createDefaultReminders(nextDue));
      }
    }
  }

  function changeDueDate(value: string) {
    setDueDate(value);
    if (kind === "invoice" && mode === "new") {
      setReminders((prev) => {
        const offsets: Record<ReminderMilestone, number> = {
          "J-3": -3,
          "J+3": 3,
          "J+7": 7,
          "J+14": 14,
        };
        return prev.map((item) => ({
          ...item,
          date: addDays(value, offsets[item.milestone]),
        }));
      });
    }
  }

  function updateLine(id: string, patch: Partial<DocumentLine>) {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  }

  function insertCatalogItem(itemId: string) {
    const item = CATALOG_ITEMS.find((i) => i.id === itemId);
    if (!item) return;
    setLines((prev) => [
      ...prev,
      {
        id: `line_${Math.random().toString(36).slice(2, 8)}`,
        description: item.description || item.name,
        quantity: 1,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        catalogItemId: item.id,
      },
    ]);
    setShowCatalog(false);
    toast.success(`« ${item.name} » ajouté`);
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
    const label = DOCUMENT_KIND_LABELS[kind];
    toast.success(
      mode === "new" ? `${label} créé(e)` : `${label} enregistré(e)`,
    );
    router.push(kind === "quote" ? "/quotes" : "/invoices");
  }

  const kindLabel = DOCUMENT_KIND_LABELS[kind];
  const listPath = kind === "quote" ? "/quotes" : "/invoices";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">
            {mode === "new"
              ? `Nouveau ${kindLabel.toLowerCase()}`
              : `${kindLabel} ${document?.number}`}
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            {mode === "new"
              ? "Remplissez les lignes : l’aperçu et la TVA se mettent à jour en direct."
              : "Modifiez les détails, la TVA, les relances et le paiement."}
          </p>
        </div>
        {mode === "edit" && document && (
          <InvoiceStatusBadge status={document.status} />
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <section className="grid gap-3 rounded-sm border border-line bg-paper p-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="client">Client</Label>
              <Select
                value={clientId}
                onValueChange={(value) => value && selectClient(value)}
              >
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
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="issueDate">Date d’émission</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => changeIssueDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">
                {kind === "quote" ? "Validité" : "Échéance"}
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => changeDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Devise</Label>
              <Select
                value={currency}
                onValueChange={(value) =>
                  value && setCurrency(value as CurrencyCode)
                }
              >
                <SelectTrigger id="currency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={orgCurrency}>
                    {CURRENCIES[orgCurrency].label} ({orgCurrency})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxMode">Prix</Label>
              <Select
                value={taxMode}
                onValueChange={(value) =>
                  value && setTaxMode(value as TaxMode)
                }
              >
                <SelectTrigger id="taxMode" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exclusive">Hors taxes (HT)</SelectItem>
                  <SelectItem value="inclusive">TVA incluse (TTC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="space-y-3 rounded-sm border border-line bg-paper p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-base font-semibold text-ink">
                Lignes
              </h2>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCatalog((v) => !v)}
                >
                  <PackagePlus className="size-3.5" aria-hidden />
                  Catalogue
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setLines((prev) => [
                      ...prev,
                      emptyLine(ORG_SETTINGS.defaultTaxRate),
                    ])
                  }
                >
                  <Plus className="size-3.5" aria-hidden />
                  Ligne
                </Button>
              </div>
            </div>

            {showCatalog && (
              <ul className="space-y-1 rounded-sm border border-line bg-muted/40 p-2">
                {CATALOG_ITEMS.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-ledger hover:bg-paper"
                      onClick={() => insertCatalogItem(item.id)}
                    >
                      <span>
                        <span className="font-medium text-ink">{item.name}</span>
                        <span className="ml-2 text-xs text-ink/50">
                          TVA {item.taxRate} %
                        </span>
                      </span>
                      <span className="num text-xs text-brass">
                        {formatMoney(item.unitPrice, item.currency)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <ul className="space-y-3">
              {lines.map((line) => (
                <li
                  key={line.id}
                  className="grid gap-2 rounded-sm border border-line/70 p-3 sm:grid-cols-[1fr_64px_96px_80px_auto]"
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
                  <div>
                    <Label className="sr-only">TVA %</Label>
                    <Select
                      value={String(line.taxRate)}
                      onValueChange={(value) =>
                        value &&
                        updateLine(line.id, { taxRate: Number(value) })
                      }
                    >
                      <SelectTrigger className="w-full num text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {taxPreset.rates.map((r) => (
                          <SelectItem key={r.rate} value={String(r.rate)}>
                            {r.rate} %
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

            <div className="space-y-1 border-t border-line pt-3 text-sm">
              <p className="flex justify-between">
                <span className="text-ink/60">Sous-total HT</span>
                <span className="num">
                  {formatMoney(totals.subtotalHt, currency)}
                </span>
              </p>
              {totals.breakdown.map((row) => (
                <p key={row.rate} className="flex justify-between text-ink/60">
                  <span>TVA {row.rate} %</span>
                  <span className="num">
                    {formatMoney(row.taxAmount, currency)}
                  </span>
                </p>
              ))}
              <p className="flex justify-between border-t border-line pt-2">
                <span className="font-medium text-ink">Total TTC</span>
                <span className="num text-lg font-semibold text-brass">
                  {formatMoney(totals.totalTtc, currency)}
                </span>
              </p>
            </div>
          </section>

          {kind === "invoice" && (
            <section className="space-y-4 rounded-sm border border-line bg-paper p-4">
              <h2 className="font-serif text-base font-semibold text-ink">
                Relances automatiques
              </h2>
              <ReminderTimeline
                reminders={reminders}
                onToggle={toggleReminder}
                showHistory={mode === "edit" && document?.status !== "draft"}
              />
            </section>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <LedgerCard className="overflow-hidden">
            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-base font-semibold text-ink">
                    {ORG_SETTINGS.companyName}
                  </p>
                  <p className="text-xs text-ink/55">{ORG_SETTINGS.email}</p>
                </div>
                {document && <InvoiceStatusBadge status={document.status} />}
              </div>
              <div className="border-t border-dashed border-line pt-3">
                <p className="text-xs uppercase tracking-wide text-ink/50">
                  {kindLabel}
                </p>
                <p className="num mt-0.5 text-sm font-medium">
                  {previewNumber}
                </p>
                <p className="mt-1 text-sm text-ink/70">
                  Pour {client?.name ?? "—"}
                </p>
                <p className="num mt-0.5 text-xs text-ink/50">
                  Émise le {formatDateFr(issueDate)} ·{" "}
                  {kind === "quote" ? "Validité" : "Échéance"}{" "}
                  {formatDateFr(dueDate)}
                </p>
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
                      {formatMoney(line.quantity * line.unitPrice, currency)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="space-y-1 border-t border-line pt-3 text-sm">
                <div className="flex justify-between text-ink/60">
                  <span>HT</span>
                  <span className="num">
                    {formatMoney(totals.subtotalHt, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-ink/60">
                  <span>TVA</span>
                  <span className="num">
                    {formatMoney(totals.taxTotal, currency)}
                  </span>
                </div>
                <div className="flex items-end justify-between pt-1">
                  <span className="text-ink/65">Total TTC</span>
                  <span className="num text-2xl font-semibold text-brass">
                    {formatMoney(totals.totalTtc, currency)}
                  </span>
                </div>
              </div>
            </div>
          </LedgerCard>

          {kind === "invoice" && (
            <>
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
                          Carte
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
                        Aperçu : QR Mobile Money / Wave / Orange Money.
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </section>

              {mode === "edit" && document && (
                <>
                  <PaymentQrSection
                    document={{
                      ...document,
                      total: totals.totalTtc,
                      currency,
                      lines,
                      taxMode,
                    }}
                  />
                  <section className="space-y-3 rounded-sm border border-line bg-paper p-4">
                    {document.paidOnlineAt ? (
                      <p className="rounded-sm border border-ledger/30 bg-ledger/10 px-3 py-2 text-sm text-ledger">
                        Payée en ligne le {formatDateFr(document.paidOnlineAt)}
                        {document.paymentMethod
                          ? ` via ${PAYMENT_METHOD_LABELS[document.paymentMethod]}`
                          : ""}
                      </p>
                    ) : onlinePayment ? (
                      <p className="text-sm text-ink/70">
                        Lien de paiement actif — en attente
                      </p>
                    ) : (
                      <p className="text-sm text-ink/55">
                        Paiement en ligne désactivé
                      </p>
                    )}
                    <p className="num truncate text-xs text-ink/50">
                      {portalUrl(document.portalToken)}
                    </p>
                    <PaymentLinkButton
                      token={document.portalToken}
                      className="w-full"
                    />
                  </section>
                </>
              )}
            </>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="bg-ledger text-paper hover:bg-ledger/90"
              onClick={handleSave}
            >
              {mode === "new" ? `Créer le ${kindLabel.toLowerCase()}` : "Enregistrer"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(listPath)}
            >
              Annuler
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Alias for quote/credit forms */
export { InvoiceForm as DocumentForm };

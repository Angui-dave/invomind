"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PackagePlus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LedgerCard } from "@/components/ledger-card";
import { DocumentLifecycle } from "@/components/documents/document-lifecycle";
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
import { saveDocument } from "@/lib/actions/documents";
import type { Client } from "@/lib/data/clients";
import type { CatalogItem } from "@/lib/data/catalog";
import type { OrgSettings } from "@/lib/data/settings";
import { portalUrl } from "@/lib/data/clients";
import { addDays, todayIso } from "@/lib/date";
import {
  DOCUMENT_KIND_LABELS,
  emptyLine,
  nextDocumentNumber,
  PAYMENT_METHOD_LABELS,
  REMINDER_DEFAULTS,
  type BusinessDocument,
  type DocumentKind,
  type DocumentLine,
  type ReminderMilestone,
  type ReminderMilestoneStatus,
} from "@/lib/documents";
import { CURRENCIES, CURRENCY_OPTIONS, type CurrencyCode } from "@/lib/money";
import {
  computeTotals,
  getTaxPresetForCurrency,
  type TaxMode,
} from "@/lib/tax";
import { formatDateFr, formatMoney } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type DocumentFormProps = {
  mode: "new" | "edit";
  kind?: DocumentKind;
  document?: BusinessDocument;
  /** When true, document was built from quote/credit conversion */
  prefilledFromConversion?: boolean;
  clients: Client[];
  catalogItems: CatalogItem[];
  orgSettings: OrgSettings;
  /** Existing docs of same kind — used only for preview numbering */
  existingNumbers?: BusinessDocument[];
};

function formatClientLabel(client: Client) {
  const name = client.name.trim();
  const company = client.company.trim();
  if (name && company && name !== company) return `${name} — ${company}`;
  return name || company || "Client";
}

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
  clients,
  catalogItems,
  orgSettings,
  existingNumbers = [],
}: DocumentFormProps) {
  const router = useRouter();
  const kind = document?.kind ?? kindProp ?? "invoice";
  const orgCurrency = orgSettings.defaultCurrency;
  const [saving, setSaving] = useState(false);

  const initialClientId = document?.clientId ?? clients[0]?.id ?? "";
  const initialClient = clients.find((c) => c.id === initialClientId);
  const initialIssue = document?.issueDate ?? todayIso();
  const initialDue =
    document?.dueDate ??
    (kind === "quote"
      ? ""
      : addDays(initialIssue, initialClient?.paymentTermDays ?? 30));
  const initialCurrency =
    document?.currency ?? initialClient?.currency ?? orgCurrency;
  const initialPreset = getTaxPresetForCurrency(
    initialCurrency,
    orgSettings.country,
  );
  const initialDefaultRate = initialPreset?.defaultRate ?? 0;
  const initialVatAvailable = initialPreset !== null;

  const [clientId, setClientId] = useState(initialClientId);
  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency);
  const [taxMode, setTaxMode] = useState<TaxMode>(
    document?.taxMode ?? orgSettings.defaultTaxMode,
  );
  const [issueDate, setIssueDate] = useState(initialIssue);
  const [dueDate, setDueDate] = useState(initialDue);
  const [lines, setLines] = useState<DocumentLine[]>(() => {
    const source = document?.lines ?? [
      {
        id: "line_1",
        description: "Prestation",
        quantity: 1,
        unitPrice: 0,
        taxRate: initialDefaultRate,
      },
    ];
    if (!initialVatAvailable) {
      return source.map((line) => ({ ...line, taxRate: 0 }));
    }
    return source;
  });
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
  const [vatEnabled, setVatEnabled] = useState(
    initialVatAvailable &&
      (document?.lines.some((line) => line.taxRate > 0) ??
        initialDefaultRate > 0),
  );

  const taxPreset = useMemo(
    () => getTaxPresetForCurrency(currency, orgSettings.country),
    [currency, orgSettings.country],
  );
  const vatAvailable = taxPreset !== null;
  const defaultRate = taxPreset?.defaultRate ?? 0;
  const vatOn = vatEnabled && vatAvailable;

  const client = clients.find((c) => c.id === clientId);
  const totals = useMemo(
    () => computeTotals(lines, taxMode),
    [lines, taxMode],
  );
  const previewNumber =
    mode === "edit" && document?.number
      ? document.number
      : nextDocumentNumber(kind, existingNumbers);

  function applyCurrency(next: CurrencyCode) {
    setCurrency(next);
    const preset = getTaxPresetForCurrency(next, orgSettings.country);
    const rate = preset && vatEnabled ? preset.defaultRate : 0;
    setLines((prev) => prev.map((line) => ({ ...line, taxRate: rate })));
  }

  function selectClient(id: string) {
    setClientId(id);
    const next = clients.find((c) => c.id === id);
    if (next?.currency) applyCurrency(next.currency);
    if (
      kind === "invoice" &&
      mode === "new" &&
      !prefilledFromConversion &&
      next?.paymentTermDays
    ) {
      const nextDue = addDays(issueDate, next.paymentTermDays);
      setDueDate(nextDue);
      setReminders(createDefaultReminders(nextDue));
    }
  }

  function changeIssueDate(value: string) {
    setIssueDate(value);
    if (kind === "invoice" && mode === "new" && !prefilledFromConversion) {
      const days = client?.paymentTermDays ?? 30;
      const nextDue = addDays(value, days);
      setDueDate(nextDue);
      setReminders(createDefaultReminders(nextDue));
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
    const item = catalogItems.find((i) => i.id === itemId);
    if (!item) return;
    setLines((prev) => [
      ...prev,
      {
        id: `line_${Math.random().toString(36).slice(2, 8)}`,
        description: item.description || item.name,
        quantity: 1,
        unitPrice: item.unitPrice,
        taxRate: vatOn ? defaultRate : 0,
        catalogItemId: item.id,
      },
    ]);
    setShowCatalog(false);
    toast.success(`« ${item.name} » ajouté`);
  }

  function toggleVat(enabled: boolean) {
    setVatEnabled(enabled);
    setLines((prev) =>
      prev.map((line) => ({
        ...line,
        taxRate: enabled ? defaultRate : 0,
      })),
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

  async function handleSave() {
    if (!clientId) {
      toast.error("Choisissez un client");
      return;
    }
    if (lines.every((l) => !l.description.trim())) {
      toast.error("Ajoutez au moins une ligne");
      return;
    }

    const label = DOCUMENT_KIND_LABELS[kind];
    setSaving(true);
    try {
      const result = await saveDocument(mode === "edit" ? document?.id ?? null : null, {
        kind,
        clientId,
        status: document?.status ?? "draft",
        currency,
        taxMode,
        issueDate,
        dueDate,
        lines: lines.map((l) => ({
          id: l.id.startsWith("line_") || l.id.startsWith("tmp_") ? undefined : l.id,
          description: l.description.trim() || "Ligne",
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
          discountPercent: l.discountPercent,
          catalogItemId: l.catalogItemId,
        })),
        onlinePaymentEnabled: onlinePayment,
        remindersEnabled:
          kind === "invoice" &&
          reminders.some((r) => r.state === "scheduled" || r.state === "sent"),
        notes: document?.notes,
        sourceDocumentId: document?.sourceDocumentId,
        paymentMethod: document?.paymentMethod ?? null,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        mode === "new" ? `${label} créé(e)` : `${label} enregistré(e)`,
      );
      router.push(kind === "quote" ? "/quotes" : "/invoices");
      router.refresh();
    } finally {
      setSaving(false);
    }
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
          <div className="flex flex-col items-end gap-3">
            <InvoiceStatusBadge status={document.status} />
            <DocumentLifecycle
              className="w-56"
              status={document.status}
              reminded={document.reminders.some((item) => item.state === "sent")}
            />
          </div>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <section className="grid gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="client">Client</Label>
              <Select
                value={clientId}
                onValueChange={(value) => value && selectClient(value)}
              >
                <SelectTrigger id="client" className="w-full">
                  <span className="min-w-0 flex-1 truncate text-left">
                    {client
                      ? formatClientLabel(client)
                      : "Choisir un client"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {formatClientLabel(c)}
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
                {kind === "quote" ? (
                  <span className="ml-1 font-normal text-ink/45">
                    (optionnel)
                  </span>
                ) : null}
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
                  value && applyCurrency(value as CurrencyCode)
                }
              >
                <SelectTrigger id="currency" className="w-full">
                  <span className="min-w-0 flex-1 truncate text-left">
                    {CURRENCIES[currency].label} ({currency})
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-line bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-base font-semibold text-ink">
                Lignes
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col items-end gap-0.5">
                  <label
                    htmlFor="vat-enabled"
                    className={cn(
                      "flex items-center gap-2 text-sm text-ink/70",
                      vatAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                    )}
                  >
                    <Switch
                      id="vat-enabled"
                      checked={vatOn}
                      disabled={!vatAvailable}
                      onCheckedChange={toggleVat}
                      aria-label="Appliquer la TVA sur toutes les lignes"
                    />
                    TVA
                  </label>
                  {!vatAvailable && (
                    <p className="text-[11px] text-ink/45">
                      TVA non applicable en {currency}
                    </p>
                  )}
                </div>
                {kind !== "quote" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCatalog((v) => !v)}
                  >
                    <PackagePlus className="size-3.5" aria-hidden />
                    Catalogue
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setLines((prev) => [
                      ...prev,
                      emptyLine(vatOn ? defaultRate : 0),
                    ])
                  }
                >
                  <Plus className="size-3.5" aria-hidden />
                  Ligne
                </Button>
              </div>
            </div>

            {kind !== "quote" && showCatalog && (
              <ul className="space-y-1 rounded-sm border border-line bg-muted/40 p-2">
                {catalogItems.map((item) => (
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
                  className={cn(
                    "grid gap-2 rounded-sm border border-line/70 p-3",
                    vatOn
                      ? "sm:grid-cols-[1fr_64px_96px_80px_auto]"
                      : "sm:grid-cols-[1fr_64px_96px_auto]",
                  )}
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
                  {vatOn && taxPreset && (
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
                  )}
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
              {vatOn &&
                totals.breakdown
                  .filter((row) => row.rate > 0)
                  .map((row) => (
                    <p
                      key={row.rate}
                      className="flex justify-between text-ink/60"
                    >
                      <span>TVA {row.rate} %</span>
                      <span className="num">
                        {formatMoney(row.taxAmount, currency)}
                      </span>
                    </p>
                  ))}
              <p className="flex justify-between border-t border-line pt-2">
                <span className="font-medium text-ink">
                  {vatOn ? "Total TTC" : "Total"}
                </span>
                <span className="num text-lg font-semibold text-brass">
                  {formatMoney(totals.totalTtc, currency)}
                </span>
              </p>
            </div>
          </section>

          {kind === "invoice" && (
            <section className="space-y-4 rounded-2xl border border-line bg-card p-4">
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
                    {orgSettings.companyName}
                  </p>
                  <p className="text-xs text-ink/55">{orgSettings.email}</p>
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
                  Émise le {formatDateFr(issueDate)}
                  {dueDate
                    ? ` · ${kind === "quote" ? "Validité" : "Échéance"} ${formatDateFr(dueDate)}`
                    : ""}
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
                {vatOn && (
                  <div className="flex justify-between text-ink/60">
                    <span>TVA</span>
                    <span className="num">
                      {formatMoney(totals.taxTotal, currency)}
                    </span>
                  </div>
                )}
                <div className="flex items-end justify-between pt-1">
                  <span className="text-ink/65">
                    {vatOn ? "Total TTC" : "Total"}
                  </span>
                  <span className="num text-2xl font-semibold text-brass">
                    {formatMoney(totals.totalTtc, currency)}
                  </span>
                </div>
              </div>
            </div>
          </LedgerCard>

          {kind === "invoice" && (
            <>
              <section className="space-y-3 rounded-2xl border border-line bg-card p-4">
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
                    orgSettings={orgSettings}
                    client={client}
                  />
                  <section className="space-y-3 rounded-2xl border border-line bg-card p-4">
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
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving
                ? "Enregistrement…"
                : mode === "new"
                  ? `Créer le ${kindLabel.toLowerCase()}`
                  : "Enregistrer"}
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

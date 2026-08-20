"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileDown, FileMinus2, Mail } from "lucide-react";
import { toast } from "sonner";
import { CatalogPicker } from "@/components/documents/catalog-picker";
import { ClientPicker } from "@/components/documents/client-picker";
import { DocumentPreview } from "@/components/documents/document-preview";
import { LineEditor } from "@/components/documents/line-editor";
import { useDocumentLines } from "@/components/documents/use-document-lines";
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
} from "@/components/ui/select";
import { saveDocument, sendDocument } from "@/lib/actions/documents";
import { downloadPdfFromUrl } from "@/lib/pdf-download";
import type { Client } from "@/lib/data/clients";
import type { CatalogItem } from "@/lib/data/catalog";
import type { OrgSettings } from "@/lib/data/settings";
import { portalUrl } from "@/lib/data/clients";
import { addDays, todayIso } from "@/lib/date";
import {
  DOCUMENT_KIND_LABELS,
  emptyLine,
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
import { formatDateFr } from "@/lib/mock-data";

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
  clients: initialClients,
  catalogItems,
  orgSettings,
  existingNumbers = [],
}: DocumentFormProps) {
  const router = useRouter();
  const kind = document?.kind ?? kindProp ?? "invoice";
  const orgCurrency = orgSettings.defaultCurrency;
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [clients, setClients] = useState(initialClients);
  const frozen = Boolean(document?.frozen);

  const initialClientId = document?.clientId ?? clients[0]?.id ?? "";
  const initialClient = clients.find((c) => c.id === initialClientId);
  const initialIssue = document?.issueDate ?? todayIso();
  const initialDue =
    document?.dueDate ??
    addDays(initialIssue, initialClient?.paymentTermDays ?? 30);
  const initialCurrency =
    document?.currency ?? initialClient?.currency ?? orgCurrency;
  const initialPreset = getTaxPresetForCurrency(
    initialCurrency,
    orgSettings.country,
  );
  const initialDefaultRate = initialPreset?.defaultRate ?? 0;
  const initialVatAvailable = initialPreset !== null;
  const initialLines: DocumentLine[] = (() => {
    const source = document?.lines ?? [
      { ...emptyLine(initialDefaultRate), description: "Prestation" },
    ];
    if (!initialVatAvailable) {
      return source.map((line) => ({ ...line, taxRate: 0 }));
    }
    return source;
  })();

  const [clientId, setClientId] = useState(initialClientId);
  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency);
  const [taxMode, setTaxMode] = useState<TaxMode>(
    document?.taxMode ?? orgSettings.defaultTaxMode,
  );
  const [issueDate, setIssueDate] = useState(initialIssue);
  const [dueDate, setDueDate] = useState(initialDue);
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

  const {
    lines,
    updateLine,
    addLine,
    removeLine,
    insertCatalogItems,
    applyTaxRate,
    mapTaxRates,
  } = useDocumentLines(initialLines);

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
      : `BROUILLON-${kind === "invoice" ? "FAC" : kind === "credit_note" ? "AV" : "DEV"}`;

  function applyCurrency(next: CurrencyCode) {
    setCurrency(next);
    const preset = getTaxPresetForCurrency(next, orgSettings.country);
    const allowed = new Set(preset?.rates.map((rate) => rate.rate) ?? []);
    let resetCount = 0;
    mapTaxRates((current) => {
      if (!vatEnabled || !preset) {
        if (current !== 0) resetCount += 1;
        return 0;
      }
      if (allowed.has(current)) return current;
      resetCount += 1;
      return preset.defaultRate;
    });
    if (resetCount > 0) {
      toast.message("Les taux de TVA ont été adaptés à la nouvelle devise");
    }
  }

  function selectClient(next: Client) {
    setClientId(next.id);
    if (next.currency) applyCurrency(next.currency);
    if (
      kind === "invoice" &&
      mode === "new" &&
      !prefilledFromConversion &&
      next.paymentTermDays
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

  function toggleVat(enabled: boolean) {
    setVatEnabled(enabled);
    applyTaxRate(enabled && taxPreset ? taxPreset.defaultRate : 0);
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

  function validateForm(): boolean {
    if (!clientId) {
      toast.error("Choisissez un client");
      return false;
    }
    if (lines.every((line) => !line.description.trim())) {
      toast.error("Ajoutez au moins une ligne");
      return false;
    }
    return true;
  }

  function documentInput() {
    return {
      kind,
      clientId,
      status: "draft" as const,
      currency,
      taxMode,
      issueDate,
      dueDate,
      lines: lines
        .filter((line) => line.description.trim())
        .map((line) => ({
          id:
            line.id.startsWith("line_") || line.id.startsWith("tmp_")
              ? undefined
              : line.id,
          description: line.description.trim(),
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxRate: line.taxRate,
          catalogItemId: line.catalogItemId,
          unit: line.unit,
        })),
      onlinePaymentEnabled: onlinePayment,
      remindersEnabled:
        kind === "invoice" &&
        reminders.some((r) => r.state === "scheduled" || r.state === "sent"),
      notes: document?.notes,
      sourceDocumentId: document?.sourceDocumentId,
      paymentMethod: document?.paymentMethod ?? null,
    };
  }

  async function persistDraft() {
    return saveDocument(
      mode === "edit" ? (document?.id ?? null) : null,
      documentInput(),
    );
  }

  async function handleSave() {
    if (frozen || !validateForm()) return;

    const label = DOCUMENT_KIND_LABELS[kind];
    setSaving(true);
    try {
      const result = await persistDraft();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        mode === "new" ? `${label} créé(e)` : `${label} enregistré(e)`,
      );
      router.push("/invoices");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateAndSend() {
    if (frozen || !validateForm()) return;

    setSaving(true);
    try {
      const saved = await persistDraft();
      if (!saved.ok) {
        toast.error(saved.error);
        return;
      }
      const id = saved.id ?? document?.id;
      if (!id) return;

      if (!client?.email?.trim()) {
        toast.error("Le client n’a pas d’adresse e-mail.");
        router.push(`/invoices/${id}`);
        router.refresh();
        return;
      }

      const sent = await sendDocument(id);
      if (!sent.ok) {
        toast.error(sent.error);
        return;
      }

      toast.success(`${DOCUMENT_KIND_LABELS[kind]} émis(e) et envoyé(e)`);
      router.push("/invoices");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleSendEmail() {
    if (!document?.id) return;
    if (!client?.email?.trim()) {
      toast.error("Le client n’a pas d’adresse e-mail.");
      return;
    }
    setSaving(true);
    try {
      const sent = await sendDocument(document.id);
      if (!sent.ok) {
        toast.error(sent.error);
        return;
      }
      toast.success("E-mail envoyé");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadPdf() {
    if (!document?.id) return;
    setDownloading(true);
    try {
      await downloadPdfFromUrl(`/api/documents/${document.id}/pdf`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Téléchargement impossible",
      );
    } finally {
      setDownloading(false);
    }
  }

  const kindLabel = DOCUMENT_KIND_LABELS[kind];

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
            {frozen
              ? "Pièce émise : les champs sont figés. Téléchargez le PDF ou créez un avoir pour corriger."
              : mode === "new"
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
        <fieldset
          disabled={frozen}
          className={`space-y-6 ${frozen ? "pointer-events-none opacity-60" : ""}`}
        >
          <section className="grid gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Client</Label>
              <ClientPicker
                clients={clients}
                clientId={clientId}
                onSelect={selectClient}
                onClientsChange={setClients}
              />
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
              <Label htmlFor="dueDate">Échéance</Label>
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

          <LineEditor
            lines={lines}
            currency={currency}
            vatOn={vatOn}
            vatAvailable={vatAvailable}
            taxPreset={taxPreset}
            catalogItems={catalogItems}
            onToggleVat={toggleVat}
            onUpdateLine={updateLine}
            onAddLine={() => addLine(vatOn ? defaultRate : 0)}
            onRemoveLine={removeLine}
            onOpenCatalog={() => setShowCatalog(true)}
          />

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
        </fieldset>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <DocumentPreview
            kind={kind}
            number={previewNumber}
            status={document?.status}
            client={client}
            orgSettings={orgSettings}
            issueDate={issueDate}
            dueDate={dueDate}
            dueLabel="Échéance"
            currency={currency}
            taxMode={taxMode}
            vatOn={vatOn}
            lines={lines}
            totals={totals}
            notes={document?.notes}
          />

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
                    disabled={frozen}
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
            {!frozen ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => void handleSave()}
                >
                  {saving
                    ? "Enregistrement…"
                    : mode === "new"
                      ? `Enregistrer le brouillon`
                      : "Enregistrer"}
                </Button>
                <Button
                  type="button"
                  className="bg-ledger text-paper hover:bg-ledger/90"
                  disabled={saving}
                  onClick={() => void handleCreateAndSend()}
                >
                  {saving
                    ? "Envoi…"
                    : mode === "new"
                      ? "Créer et envoyer"
                      : "Émettre et envoyer"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  className="bg-ledger text-paper hover:bg-ledger/90"
                  disabled={downloading}
                  onClick={() => void handleDownloadPdf()}
                >
                  <FileDown />
                  {downloading ? "Préparation du PDF…" : "Télécharger le PDF"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => void handleSendEmail()}
                >
                  <Mail />
                  {saving ? "Envoi…" : "Envoyer par e-mail"}
                </Button>
                {kind === "invoice" && document ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      router.push(`/invoices/new?creditOf=${document.id}`)
                    }
                  >
                    <FileMinus2 />
                    Créer un avoir
                  </Button>
                ) : null}
              </>
            )}
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

      <CatalogPicker
        open={showCatalog}
        items={catalogItems}
        onOpenChange={setShowCatalog}
        onConfirm={(items) => {
          insertCatalogItems(items, vatOn ? defaultRate : 0);
          if (items.length === 1) {
            toast.success(`« ${items[0].name} » ajouté`);
          } else if (items.length > 1) {
            toast.success(`${items.length} prestations ajoutées`);
          }
        }}
      />
    </div>
  );
}

/** Alias for quote/credit forms */
export { InvoiceForm as DocumentForm };

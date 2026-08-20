"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FileDown, Mail } from "lucide-react";
import { toast } from "sonner";
import { CatalogPicker } from "@/components/documents/catalog-picker";
import { ClientPicker } from "@/components/documents/client-picker";
import { DocumentPreview } from "@/components/documents/document-preview";
import { LineEditor } from "@/components/documents/line-editor";
import { useDocumentLines } from "@/components/documents/use-document-lines";
import { DocumentLifecycle } from "@/components/documents/document-lifecycle";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveDocument, sendDocument } from "@/lib/actions/documents";
import { downloadPdfFromUrl } from "@/lib/pdf-download";
import type { CatalogItem } from "@/lib/data/catalog";
import type { Client } from "@/lib/data/clients";
import type { OrgSettings } from "@/lib/data/settings";
import { todayIso } from "@/lib/date";
import {
  type BusinessDocument,
  type DocumentLine,
} from "@/lib/documents";
import { formatDateFr } from "@/lib/mock-data";
import { CURRENCIES, CURRENCY_OPTIONS, type CurrencyCode } from "@/lib/money";
import {
  computeTotals,
  getTaxPresetForCurrency,
  type TaxMode,
} from "@/lib/tax";

const NOTE_SNIPPETS = [
  "Acompte de 30 % à la commande.",
  "Devis valable 30 jours.",
  "Délai de livraison : ",
] as const;

type QuoteDraft = {
  clientId: string;
  currency: CurrencyCode;
  taxMode: TaxMode;
  issueDate: string;
  dueDate: string;
  lines: DocumentLine[];
  notes: string;
  vatEnabled: boolean;
};

type FieldErrors = {
  clientId?: string;
  lines?: string;
};

type QuoteFormProps = {
  mode: "new" | "edit";
  document?: BusinessDocument;
  clients: Client[];
  catalogItems: CatalogItem[];
  orgSettings: OrgSettings;
  existingNumbers?: BusinessDocument[];
};

function daysBetween(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00`);
  const end = Date.parse(`${to}T00:00:00`);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.round((end - start) / 86_400_000);
}

function draftKey(mode: "new" | "edit", id?: string) {
  return `invomind:quote-draft:${mode}:${id ?? "new"}`;
}

export function QuoteForm({
  mode,
  document,
  clients: initialClients,
  catalogItems,
  orgSettings,
  existingNumbers = [],
}: QuoteFormProps) {
  const router = useRouter();
  const orgCurrency = orgSettings.defaultCurrency;
  const initialIssue = document?.issueDate ?? todayIso();
  const initialDue = document?.dueDate ?? "";
  const initialClientId = document?.clientId ?? "";
  const initialClient = initialClients.find((c) => c.id === initialClientId);
  const initialCurrency =
    document?.currency ?? initialClient?.currency ?? orgCurrency;
  const initialPreset = getTaxPresetForCurrency(
    initialCurrency,
    orgSettings.country,
  );
  const initialDefaultRate = initialPreset?.defaultRate ?? 0;
  const initialVatAvailable = initialPreset !== null;
  const initialLines: DocumentLine[] = document?.lines?.length
    ? document.lines
    : [];

  const [clients, setClients] = useState(initialClients);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [clientId, setClientId] = useState(initialClientId);
  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency);
  const [taxMode, setTaxMode] = useState<TaxMode>(
    document?.taxMode ?? orgSettings.defaultTaxMode,
  );
  const [issueDate, setIssueDate] = useState(initialIssue);
  const [dueDate, setDueDate] = useState(initialDue);
  const [notes, setNotes] = useState(document?.notes ?? "");
  const [showCatalog, setShowCatalog] = useState(false);
  const [vatEnabled, setVatEnabled] = useState(
    initialVatAvailable &&
      (document?.lines.some((line) => line.taxRate > 0) ??
        initialDefaultRate > 0),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pendingDraft, setPendingDraft] = useState<QuoteDraft | null>(null);
  const submitIntent = useRef<"draft" | "sent">("sent");
  const skipLeavePrompt = useRef(false);

  const lineState = useDocumentLines(initialLines);
  const {
    lines,
    setLines,
    updateLine,
    addLine,
    removeLine,
    insertCatalogItems,
    applyTaxRate,
    mapTaxRates,
  } = lineState;

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
      : "BROUILLON-DEV";

  const snapshot = useMemo(
    () =>
      JSON.stringify({
        clientId,
        currency,
        taxMode,
        issueDate,
        dueDate,
        notes,
        lines,
        vatEnabled,
      }),
    [
      clientId,
      currency,
      taxMode,
      issueDate,
      dueDate,
      notes,
      lines,
      vatEnabled,
    ],
  );
  const initialSnapshot = useRef(
    JSON.stringify({
      clientId: initialClientId,
      currency: initialCurrency,
      taxMode: document?.taxMode ?? orgSettings.defaultTaxMode,
      issueDate: initialIssue,
      dueDate: initialDue,
      notes: document?.notes ?? "",
      lines: initialLines,
      vatEnabled:
        initialVatAvailable &&
        (document?.lines.some((line) => line.taxRate > 0) ??
          initialDefaultRate > 0),
    }),
  );
  const dirty = snapshot !== initialSnapshot.current;
  const storageKey = draftKey(mode, document?.id);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as QuoteDraft;
      if (!parsed?.lines) return;
      if (JSON.stringify(parsed) === initialSnapshot.current) return;
      setPendingDraft(parsed);
    } catch {
      /* ignore corrupted drafts */
    }
  }, [storageKey]);

  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => {
      const draft: QuoteDraft = {
        clientId,
        currency,
        taxMode,
        issueDate,
        dueDate,
        lines,
        notes,
        vatEnabled,
      };
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(draft));
      } catch {
        /* quota */
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [
    dirty,
    clientId,
    currency,
    taxMode,
    issueDate,
    dueDate,
    lines,
    notes,
    vatEnabled,
    storageKey,
  ]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty || skipLeavePrompt.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function restoreDraft(draft: QuoteDraft) {
    setClientId(draft.clientId);
    setCurrency(draft.currency);
    setTaxMode(draft.taxMode);
    setIssueDate(draft.issueDate);
    setDueDate(draft.dueDate);
    setLines(draft.lines);
    setNotes(draft.notes);
    setVatEnabled(draft.vatEnabled);
    setPendingDraft(null);
  }

  function discardDraft() {
    setPendingDraft(null);
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }

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
    setErrors((prev) => ({ ...prev, clientId: undefined }));
    if (next.currency) applyCurrency(next.currency);
  }

  function changeIssueDate(value: string) {
    setIssueDate(value);
  }

  function toggleVat(enabled: boolean) {
    setVatEnabled(enabled);
    applyTaxRate(enabled && taxPreset ? taxPreset.defaultRate : 0);
  }

  function insertSnippet(snippet: string) {
    setNotes((prev) =>
      prev.trim() ? `${prev.trim()}\n${snippet}` : snippet,
    );
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!clientId) next.clientId = "Choisissez un client";
    if (lines.every((line) => !line.description.trim())) {
      next.lines = "Ajoutez au moins une prestation";
    }
    return next;
  }

  function focusFirstError(next: FieldErrors) {
    const id = next.clientId ? "field-client" : "field-lines";
    const root = globalThis.document;
    root.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    const focusable = root.querySelector<HTMLElement>(
      `#${id} button, #${id} input, #${id} textarea`,
    );
    focusable?.focus();
  }

  const remaining = dueDate ? daysBetween(todayIso(), dueDate) : null;
  const validityHint =
    dueDate && remaining !== null
      ? remaining < 0
        ? `Expiré depuis le ${formatDateFr(dueDate)}`
        : remaining === 0
          ? `Expire aujourd’hui (${formatDateFr(dueDate)})`
          : `Expire le ${formatDateFr(dueDate)}, dans ${remaining} jour${remaining > 1 ? "s" : ""}`
      : null;
  const frozen = Boolean(document?.frozen);

  async function persist(intent: "draft" | "sent") {
    if (frozen) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors);
      return;
    }

    setSaving(true);
    try {
      const result = await saveDocument(
        mode === "edit" ? (document?.id ?? null) : null,
        {
          kind: "quote",
          clientId,
          status: "draft",
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
          onlinePaymentEnabled: false,
          remindersEnabled: false,
          notes: notes.trim() || undefined,
          sourceDocumentId: document?.sourceDocumentId,
          paymentMethod: null,
        },
      );

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      const id = result.id ?? document?.id;
      if (intent === "sent") {
        if (!client?.email?.trim()) {
          toast.error("Le client n’a pas d’adresse e-mail.");
          if (id && mode === "new") {
            skipLeavePrompt.current = true;
            discardDraft();
            router.push(`/quotes/${id}`);
            router.refresh();
          }
          return;
        }
        if (!id) return;
        const sent = await sendDocument(id);
        if (!sent.ok) {
          toast.error(sent.error);
          return;
        }
      }

      skipLeavePrompt.current = true;
      discardDraft();
      toast.success(
        intent === "sent"
          ? mode === "new"
            ? "Devis créé et envoyé"
            : "Devis envoyé"
          : mode === "new"
            ? "Brouillon enregistré"
            : "Devis enregistré",
      );
      router.push("/quotes");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleSendEmail() {
    if (!client?.email?.trim()) {
      toast.error("Le client n’a pas d’adresse e-mail.");
      return;
    }
    if (frozen && document?.id) {
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
      return;
    }
    await persist("sent");
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void persist(submitIntent.current);
  }

  function requestLeave() {
    if (
      dirty &&
      !window.confirm(
        "Des modifications non enregistrées seront perdues. Quitter ?",
      )
    ) {
      return;
    }
    skipLeavePrompt.current = true;
    router.push("/quotes");
  }

  const actions = (
    <QuoteActions
      mode={mode}
      frozen={frozen}
      saving={saving}
      downloading={downloading}
      onDraft={() => void persist("draft")}
      onSend={() => {
        submitIntent.current = "sent";
      }}
      onSendEmail={() => void handleSendEmail()}
      onDownload={() => void handleDownloadPdf()}
      onCancel={requestLeave}
    />
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24 lg:pb-0">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">
            {mode === "new"
              ? "Nouveau devis"
              : `Devis ${document?.number}`}
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            {frozen
              ? "Ce devis est émis : il n’est plus modifiable."
              : mode === "new"
                ? "Choisissez un client, ajoutez les prestations : l’aperçu se met à jour en direct."
                : "Modifiez les prestations, la validité et les conditions."}
          </p>
        </div>
        {mode === "edit" && document && (
          <div className="flex flex-col items-end gap-3">
            <InvoiceStatusBadge status={document.status} />
            <DocumentLifecycle
              className="w-56"
              status={document.status}
              reminded={false}
            />
          </div>
        )}
      </header>

      {pendingDraft ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ledger/30 bg-ledger/8 px-4 py-3 text-sm">
          <p className="text-ink">Un brouillon non enregistré a été trouvé.</p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="bg-ledger text-paper hover:bg-ledger/90"
              onClick={() => restoreDraft(pendingDraft)}
            >
              Reprendre le brouillon
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={discardDraft}>
              Ignorer
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <fieldset
          disabled={frozen}
          className={`space-y-6 ${frozen ? "pointer-events-none opacity-60" : ""}`}
        >
          <section className="space-y-4 rounded-2xl border border-line bg-card p-4">
            <h2 className="font-serif text-base font-semibold text-ink">
              Destinataire
            </h2>
            <ClientPicker
              clients={clients}
              clientId={clientId}
              error={errors.clientId}
              onSelect={selectClient}
              onClientsChange={setClients}
            />
          </section>

          <section className="space-y-4 rounded-2xl border border-line bg-card p-4">
            <h2 className="font-serif text-base font-semibold text-ink">
              Dates et conditions
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
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
                  Validité
                  <span className="ml-1 font-normal text-ink/45">
                    (optionnel)
                  </span>
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                {validityHint ? (
                  <p className="text-xs text-ink/50">{validityHint}</p>
                ) : (
                  <p className="text-xs text-ink/45">
                    Sans date, le devis n’expire pas.
                  </p>
                )}
              </div>
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
            error={errors.lines}
            showUnit={false}
            onToggleVat={toggleVat}
            onUpdateLine={updateLine}
            onAddLine={() => addLine(vatOn ? defaultRate : 0)}
            onRemoveLine={removeLine}
            onOpenCatalog={() => setShowCatalog(true)}
          />

          <section className="space-y-3 rounded-2xl border border-line bg-card p-4">
            <h2 className="font-serif text-base font-semibold text-ink">
              Notes
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {NOTE_SNIPPETS.map((snippet) => (
                <button
                  key={snippet}
                  type="button"
                  className="rounded-full border border-line px-2.5 py-1 text-xs text-ink/70 transition-ledger hover:bg-muted/50"
                  onClick={() => insertSnippet(snippet)}
                >
                  {snippet.replace(" : ", "")}
                </button>
              ))}
            </div>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Conditions de règlement, délai, mentions…"
              rows={4}
            />
          </section>
        </fieldset>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <DocumentPreview
            kind="quote"
            number={previewNumber}
            status={document?.status}
            client={client}
            orgSettings={orgSettings}
            issueDate={issueDate}
            dueDate={dueDate}
            dueLabel="Validité"
            currency={currency}
            taxMode={taxMode}
            vatOn={vatOn}
            lines={lines}
            totals={totals}
            notes={notes}
          />
          <div className="hidden lg:block">{actions}</div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 p-3 backdrop-blur-lg lg:hidden">
        {actions}
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
          setErrors((prev) => ({ ...prev, lines: undefined }));
        }}
      />
    </form>
  );
}

function QuoteActions({
  mode,
  frozen,
  saving,
  downloading,
  onDraft,
  onSend,
  onSendEmail,
  onDownload,
  onCancel,
}: {
  mode: "new" | "edit";
  frozen: boolean;
  saving: boolean;
  downloading: boolean;
  onDraft: () => void;
  onSend: () => void;
  onSendEmail: () => void;
  onDownload: () => void;
  onCancel: () => void;
}) {
  const sendLabel = mode === "new" ? "Créer et envoyer" : "Émettre et envoyer";

  if (frozen) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="bg-ledger text-paper hover:bg-ledger/90"
          disabled={downloading}
          onClick={onDownload}
        >
          <FileDown />
          {downloading ? "Préparation du PDF…" : "Télécharger le PDF"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={onSendEmail}
        >
          <Mail />
          {saving ? "Envoi…" : "Envoyer par e-mail"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={saving}
        onClick={onDraft}
      >
        {saving ? "Enregistrement…" : "Enregistrer en brouillon"}
      </Button>
      <Button
        type="submit"
        className="bg-ledger text-paper hover:bg-ledger/90"
        disabled={saving}
        onClick={onSend}
      >
        {saving ? "Envoi…" : sendLabel}
      </Button>
      <Button type="button" variant="outline" onClick={onCancel}>
        Annuler
      </Button>
    </div>
  );
}

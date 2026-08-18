"use client";

import { useEffect, useState } from "react";
import { PackagePlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { CatalogItem } from "@/lib/data/catalog";
import type { DocumentLine } from "@/lib/documents";
import { type CurrencyCode } from "@/lib/money";
import { type CountryTaxPreset } from "@/lib/tax";
import { cn } from "@/lib/utils";

type LineEditorProps = {
  lines: DocumentLine[];
  currency: CurrencyCode;
  vatOn: boolean;
  vatAvailable: boolean;
  taxPreset: CountryTaxPreset | null;
  catalogItems: CatalogItem[];
  error?: string;
  onToggleVat: (enabled: boolean) => void;
  onUpdateLine: (id: string, patch: Partial<DocumentLine>) => void;
  onAddLine: () => void;
  onRemoveLine: (id: string) => void;
  onOpenCatalog: () => void;
  showUnit?: boolean;
};

export function LineEditor({
  lines,
  currency,
  vatOn,
  vatAvailable,
  taxPreset,
  catalogItems,
  error,
  onToggleVat,
  onUpdateLine,
  onAddLine,
  onRemoveLine,
  onOpenCatalog,
  showUnit = true,
}: LineEditorProps) {
  return (
    <section
      id="field-lines"
      className={cn(
        "space-y-3 rounded-2xl border bg-card p-4",
        error ? "border-brick/50" : "border-line",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-base font-semibold text-ink">
          Prestations
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col items-end gap-0.5">
            <label
              htmlFor="vat-enabled"
              className={cn(
                "flex items-center gap-2 text-sm text-ink/70",
                vatAvailable
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-60",
              )}
            >
              <Switch
                id="vat-enabled"
                checked={vatOn}
                disabled={!vatAvailable}
                onCheckedChange={onToggleVat}
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
          {catalogItems.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenCatalog}
            >
              <PackagePlus className="size-3.5" aria-hidden />
              Catalogue
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={onAddLine}>
            <Plus className="size-3.5" aria-hidden />
            Ligne
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-brick" role="alert">
          {error}
        </p>
      ) : null}

      {lines.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line px-4 py-10 text-center">
          <p className="text-sm font-medium text-ink">
            Ajoutez votre première prestation
          </p>
          <p className="max-w-sm text-sm text-ink/55">
            Saisissez une ligne ou piochez dans le catalogue pour préremplir
            description, prix et unité.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {catalogItems.length > 0 && (
              <Button type="button" variant="outline" onClick={onOpenCatalog}>
                <PackagePlus className="size-3.5" aria-hidden />
                Catalogue
              </Button>
            )}
            <Button
              type="button"
              className="bg-ledger text-paper hover:bg-ledger/90"
              onClick={onAddLine}
            >
              <Plus className="size-3.5" aria-hidden />
              Ajouter une ligne
            </Button>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {lines.map((line, index) => (
            <li
              key={line.id}
              className={cn(
                "grid items-end gap-2 rounded-xl border border-line/70 p-3",
                showUnit && vatOn
                  ? "md:grid-cols-[minmax(0,1.6fr)_72px_88px_112px_88px_auto]"
                  : showUnit
                    ? "md:grid-cols-[minmax(0,1.6fr)_72px_88px_112px_auto]"
                    : vatOn
                      ? "md:grid-cols-[minmax(0,1.6fr)_72px_112px_88px_auto]"
                      : "md:grid-cols-[minmax(0,1.6fr)_72px_112px_auto]",
              )}
            >
              <LineFields
                line={line}
                index={index}
                vatOn={vatOn}
                taxPreset={taxPreset}
                showUnit={showUnit}
                onUpdateLine={onUpdateLine}
                onRemoveLine={onRemoveLine}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LineFields({
  line,
  index,
  vatOn,
  taxPreset,
  showUnit,
  onUpdateLine,
  onRemoveLine,
}: {
  line: DocumentLine;
  index: number;
  vatOn: boolean;
  taxPreset: CountryTaxPreset | null;
  showUnit: boolean;
  onUpdateLine: (id: string, patch: Partial<DocumentLine>) => void;
  onRemoveLine: (id: string) => void;
}) {
  const n = index + 1;
  const descId = `line-${line.id}-desc`;
  const qtyId = `line-${line.id}-qty`;
  const unitId = `line-${line.id}-unit`;
  const priceId = `line-${line.id}-price`;
  const taxId = `line-${line.id}-tax`;

  const actions = (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="self-end justify-self-end text-ink/50 hover:text-brick"
      onClick={() => onRemoveLine(line.id)}
      aria-label={`Supprimer la ligne ${n}`}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );

  const description = (
    <div className="min-w-0 space-y-1.5 max-md:col-span-2">
      <Label htmlFor={descId}>Description</Label>
      <Input
        id={descId}
        value={line.description}
        onChange={(e) => onUpdateLine(line.id, { description: e.target.value })}
        placeholder="Description"
      />
    </div>
  );

  const quantity = (
    <div className="space-y-1.5">
      <Label htmlFor={qtyId}>Quantité</Label>
      <NumericInput
        id={qtyId}
        value={line.quantity}
        className="text-right"
        aria-label={`Quantité, ligne ${n}`}
        onChange={(value) => onUpdateLine(line.id, { quantity: value })}
      />
    </div>
  );

  const unit = showUnit ? (
    <div className="space-y-1.5">
      <Label htmlFor={unitId}>Unité</Label>
      <Input
        id={unitId}
        value={line.unit ?? ""}
        onChange={(e) => onUpdateLine(line.id, { unit: e.target.value })}
        placeholder="unité"
      />
    </div>
  ) : null;

  const price = (
    <div className="space-y-1.5">
      <Label htmlFor={priceId}>Prix unitaire</Label>
      <NumericInput
        id={priceId}
        value={line.unitPrice}
        className="text-right"
        aria-label={`Prix unitaire, ligne ${n}`}
        onChange={(value) => onUpdateLine(line.id, { unitPrice: value })}
      />
    </div>
  );

  const vat = vatOn && taxPreset ? (
    <div className="space-y-1.5">
      <Label htmlFor={taxId}>TVA %</Label>
      <Select
        value={String(line.taxRate)}
        onValueChange={(value) =>
          value && onUpdateLine(line.id, { taxRate: Number(value) })
        }
      >
        <SelectTrigger id={taxId} className="w-full num text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {taxPreset.rates.map((rate) => (
            <SelectItem key={rate.rate} value={String(rate.rate)}>
              {rate.rate} %
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ) : null;

  return (
    <>
      {description}
      {quantity}
      {unit}
      {price}
      {vat}
      {actions}
    </>
  );
}

function NumericInput({
  id,
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
}: {
  id: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  "aria-label"?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(formatNumeric(value));

  useEffect(() => {
    if (!focused) setText(formatNumeric(value));
  }, [value, focused]);

  return (
    <Input
      id={id}
      inputMode="decimal"
      className={cn("num", className)}
      value={focused ? text : formatNumeric(value)}
      aria-label={ariaLabel}
      onFocus={(event) => {
        setFocused(true);
        setText(value === 0 ? "" : formatNumeric(value));
        event.target.select();
      }}
      onChange={(event) => {
        const next = event.target.value;
        setText(next);
        if (next.trim() === "") return;
        const parsed = parseNumeric(next);
        if (parsed !== null) onChange(parsed);
      }}
      onBlur={() => {
        setFocused(false);
        const parsed = parseNumeric(text);
        onChange(parsed ?? 0);
      }}
    />
  );
}

function formatNumeric(value: number): string {
  if (!Number.isFinite(value)) return "";
  return String(value);
}

function parseNumeric(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (normalized === "" || normalized === "-" || normalized === ".") return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

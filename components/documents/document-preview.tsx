"use client";

import { LedgerCard } from "@/components/ledger-card";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { formatClientLabel } from "@/components/documents/client-picker";
import type { Client } from "@/lib/data/clients";
import type { OrgSettings } from "@/lib/data/settings";
import {
  DOCUMENT_KIND_LABELS,
  type BusinessDocument,
  type DocumentKind,
  type DocumentLine,
} from "@/lib/documents";
import { formatDateFr } from "@/lib/mock-data";
import { formatMoney, type CurrencyCode } from "@/lib/money";
import { lineNet, type DocumentTotals, type TaxMode } from "@/lib/tax";
import { cn } from "@/lib/utils";

type DocumentPreviewProps = {
  kind: DocumentKind;
  number: string;
  status?: BusinessDocument["status"];
  client?: Client;
  orgSettings: OrgSettings;
  issueDate: string;
  dueDate: string;
  dueLabel?: string;
  currency: CurrencyCode;
  taxMode: TaxMode;
  vatOn: boolean;
  lines: DocumentLine[];
  totals: DocumentTotals;
  notes?: string;
  className?: string;
};

export function DocumentPreview({
  kind,
  number,
  status,
  client,
  orgSettings,
  issueDate,
  dueDate,
  dueLabel = "Échéance",
  currency,
  taxMode,
  vatOn,
  lines,
  totals,
  notes,
  className,
}: DocumentPreviewProps) {
  const kindLabel = DOCUMENT_KIND_LABELS[kind];
  const visibleLines = lines.filter(
    (line) => line.description.trim() || line.unitPrice > 0,
  );

  return (
    <LedgerCard className={cn("overflow-hidden", className)}>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-serif text-base font-semibold text-ink">
              {orgSettings.companyName}
            </p>
            <p className="text-xs text-ink/55">{orgSettings.email}</p>
            {orgSettings.address ? (
              <p className="text-xs text-ink/55">
                {orgSettings.address}
                {orgSettings.city ? `, ${orgSettings.city}` : ""}
              </p>
            ) : null}
            {orgSettings.taxId ? (
              <p className="text-xs text-ink/45">NINEA {orgSettings.taxId}</p>
            ) : null}
          </div>
          {status ? <InvoiceStatusBadge status={status} /> : null}
        </div>

        <div className="grid gap-3 border-t border-dashed border-line pt-3 sm:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink/45">
              {kindLabel}
            </p>
            <p className="num mt-0.5 text-sm font-medium">{number}</p>
            <p className="num mt-1 text-xs text-ink/50">
              Émis le {formatDateFr(issueDate)}
              {dueDate ? ` · ${dueLabel} ${formatDateFr(dueDate)}` : ""}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] uppercase tracking-wide text-ink/45">
              Destinataire
            </p>
            {client ? (
              <>
                <p className="mt-0.5 text-sm font-medium text-ink">
                  {formatClientLabel(client)}
                </p>
                {client.address ? (
                  <p className="text-xs text-ink/55">{client.address}</p>
                ) : null}
                <p className="text-xs text-ink/55">
                  {[client.postalCode, client.city].filter(Boolean).join(" ")}
                </p>
              </>
            ) : (
              <p className="mt-0.5 text-sm text-ink/45">Aucun client</p>
            )}
          </div>
        </div>

        <ul className="space-y-2 border-t border-line pt-3">
          {visibleLines.length === 0 ? (
            <li className="text-sm text-ink/45">Aucune prestation</li>
          ) : (
            visibleLines.map((line) => (
              <li key={line.id} className="text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-ink/80">
                    {line.description || "Ligne"}
                  </span>
                  <span className="num shrink-0 font-medium">
                    {formatMoney(lineNet(line), currency)}
                  </span>
                </div>
                <p className="num text-[11px] text-ink/45">
                  {line.quantity}
                  {kind !== "quote" ? ` ${line.unit || "unité"}` : ""} ×{" "}
                  {formatMoney(line.unitPrice, currency)}
                </p>
              </li>
            ))
          )}
        </ul>

        <div className="space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between text-ink/60">
            <span>{taxMode === "inclusive" ? "Dont HT" : "HT"}</span>
            <span className="num">{formatMoney(totals.subtotalHt, currency)}</span>
          </div>
          {vatOn &&
            totals.breakdown
              .filter((row) => row.rate > 0)
              .map((row) => (
                <div
                  key={row.rate}
                  className="flex justify-between text-ink/60"
                >
                  <span>TVA {row.rate} %</span>
                  <span className="num">
                    {formatMoney(row.taxAmount, currency)}
                  </span>
                </div>
              ))}
          <div className="flex items-end justify-between pt-1">
            <span className="text-ink/65">{vatOn ? "Total TTC" : "Total"}</span>
            <span className="num text-2xl font-semibold text-brass">
              {formatMoney(totals.totalTtc, currency)}
            </span>
          </div>
        </div>

        {notes?.trim() ? (
          <div className="border-t border-dashed border-line pt-3">
            <p className="text-[11px] uppercase tracking-wide text-ink/45">
              Notes
            </p>
            <p className="mt-1 whitespace-pre-wrap text-xs text-ink/70">
              {notes.trim()}
            </p>
          </div>
        ) : null}
      </div>
    </LedgerCard>
  );
}

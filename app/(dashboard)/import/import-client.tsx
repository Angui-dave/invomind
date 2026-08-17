"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  autoMapColumns,
  IMPORT_FIELD_OPTIONS,
  mapRows,
  parseCsv,
  type ImportEntity,
} from "@/lib/import/csv";
import { cn } from "@/lib/utils";

export function ImportPageClient() {
  const [entity, setEntity] = useState<ImportEntity>("clients");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<Record<string, string>[]>([]);

  const step = headers.length === 0 ? 1 : preview.length === 0 ? 2 : 3;

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = parseCsv(text);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      const auto = autoMapColumns(parsed.headers, entity);
      setMapping(auto);
      setPreview(mapRows(parsed.headers, parsed.rows.slice(0, 5), auto));
      toast.success(`${parsed.rows.length} ligne(s) détectée(s)`);
    };
    reader.readAsText(file);
  }

  function applyImport() {
    const mapped = mapRows(headers, rows, mapping);
    void (async () => {
      const { importRows } = await import("@/lib/actions/import");
      const result = await importRows(entity, mapped);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `${result.count ?? mapped.length} ${entity === "clients" ? "clients" : entity === "expenses" ? "dépenses" : "éléments"} importés`,
      );
    })();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-semibold text-ink">
          Importation de données
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Importez un fichier CSV pour migrer clients, dépenses ou catalogue
        </p>
      </header>

      <ol className="grid gap-2 sm:grid-cols-3">
        {[
          { n: 1, label: "Fichier" },
          { n: 2, label: "Mapping" },
          { n: 3, label: "Aperçu & import" },
        ].map((item) => (
          <li
            key={item.n}
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm",
              step >= item.n
                ? "border-ledger/30 bg-ledger/8 text-ink"
                : "border-line bg-card text-ink/45",
            )}
          >
            <span className="num font-semibold">{item.n}.</span> {item.label}
          </li>
        ))}
      </ol>

      <section className="space-y-4 rounded-2xl border border-line bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Type de données</Label>
            <Select
              value={entity}
              onValueChange={(v) => {
                if (!v) return;
                const next = v as ImportEntity;
                setEntity(next);
                if (headers.length) {
                  const auto = autoMapColumns(headers, next);
                  setMapping(auto);
                  setPreview(mapRows(headers, rows.slice(0, 5), auto));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clients">Clients</SelectItem>
                <SelectItem value="expenses">Dépenses</SelectItem>
                <SelectItem value="catalog">Catalogue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Fichier CSV</Label>
            <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-muted/40 text-center text-sm text-ink/60 transition-ledger hover:border-ledger/40 hover:text-ink">
              Glissez un CSV ici ou cliquez pour choisir
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>
          </div>
        </div>

        {headers.length > 0 && (
          <>
            <div>
              <h2 className="mb-2 font-serif text-base font-semibold text-ink">
                Mapping des colonnes
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {IMPORT_FIELD_OPTIONS[entity].map((field) => (
                  <div key={field.key} className="flex items-center gap-2">
                    <span className="w-28 shrink-0 text-sm text-ink/70">
                      {field.label}
                    </span>
                    <Select
                      value={mapping[field.key] ?? "__skip"}
                      onValueChange={(v) => {
                        const next = { ...mapping };
                        if (!v || v === "__skip") delete next[field.key];
                        else next[field.key] = v;
                        setMapping(next);
                        setPreview(mapRows(headers, rows.slice(0, 5), next));
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Ignorer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__skip">— Ignorer —</SelectItem>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-2 font-serif text-base font-semibold text-ink">
                Aperçu (5 premières lignes)
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-line">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {IMPORT_FIELD_OPTIONS[entity].map((f) => (
                        <TableHead key={f.key}>{f.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, i) => (
                      <TableRow key={i}>
                        {IMPORT_FIELD_OPTIONS[entity].map((f) => (
                          <TableCell key={f.key} className="text-sm">
                            {row[f.key] || "—"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <Button
              type="button"
              className="rounded-full bg-ledger text-paper hover:bg-ledger/90"
              onClick={applyImport}
            >
              Importer {rows.length} ligne(s)
            </Button>
          </>
        )}
      </section>
    </div>
  );
}

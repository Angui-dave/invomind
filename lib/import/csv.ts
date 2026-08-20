/** Lightweight CSV parser + column mapping helpers */

export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter);
  const rows = lines.slice(1).map((line) => splitCsvLine(line, delimiter));
  return { headers, rows };
}

function detectDelimiter(line: string): string {
  const commas = (line.match(/,/g) ?? []).length;
  const semis = (line.match(/;/g) ?? []).length;
  return semis > commas ? ";" : ",";
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export type ImportEntity = "clients" | "expenses" | "catalog" | "suppliers";

export const IMPORT_FIELD_OPTIONS: Record<
  ImportEntity,
  { key: string; label: string }[]
> = {
  clients: [
    { key: "name", label: "Nom" },
    { key: "company", label: "Entreprise" },
    { key: "email", label: "E-mail" },
    { key: "phone", label: "Téléphone" },
    { key: "city", label: "Ville" },
    { key: "country", label: "Pays" },
  ],
  suppliers: [
    { key: "name", label: "Nom" },
    { key: "company", label: "Entreprise" },
    { key: "email", label: "E-mail" },
    { key: "phone", label: "Téléphone" },
    { key: "city", label: "Ville" },
    { key: "country", label: "Pays" },
  ],
  expenses: [
    { key: "date", label: "Date" },
    { key: "description", label: "Description" },
    { key: "amount", label: "Montant" },
    { key: "category", label: "Catégorie" },
    { key: "supplier", label: "Fournisseur" },
  ],
  catalog: [
    { key: "name", label: "Nom" },
    { key: "description", label: "Description" },
    { key: "unitPrice", label: "Prix unitaire" },
    { key: "taxRate", label: "Taux TVA" },
    { key: "unit", label: "Unité" },
  ],
};

export function autoMapColumns(
  headers: string[],
  entity: ImportEntity,
): Record<string, string> {
  const fields = IMPORT_FIELD_OPTIONS[entity];
  const mapping: Record<string, string> = {};
  for (const field of fields) {
    const match = headers.find(
      (h) =>
        h.toLowerCase().includes(field.key.toLowerCase()) ||
        h.toLowerCase().includes(field.label.toLowerCase()),
    );
    if (match) mapping[field.key] = match;
  }
  return mapping;
}

export function mapRows(
  headers: string[],
  rows: string[][],
  mapping: Record<string, string>,
): Record<string, string>[] {
  return rows.map((row) => {
    const obj: Record<string, string> = {};
    for (const [field, header] of Object.entries(mapping)) {
      const idx = headers.indexOf(header);
      obj[field] = idx >= 0 ? (row[idx] ?? "") : "";
    }
    return obj;
  });
}

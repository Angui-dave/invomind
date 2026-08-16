/** VAT / tax presets by country + totals computation */

export type TaxMode = "inclusive" | "exclusive";

export interface TaxRateOption {
  rate: number;
  label: string;
}

export interface CountryTaxPreset {
  countryCode: string;
  countryLabel: string;
  defaultRate: number;
  rates: TaxRateOption[];
}

export const TAX_PRESETS: CountryTaxPreset[] = [
  {
    countryCode: "SN",
    countryLabel: "Sénégal (UEMOA)",
    defaultRate: 18,
    rates: [
      { rate: 18, label: "TVA 18 %" },
      { rate: 0, label: "Exonéré" },
    ],
  },
  {
    countryCode: "CI",
    countryLabel: "Côte d'Ivoire (UEMOA)",
    defaultRate: 18,
    rates: [
      { rate: 18, label: "TVA 18 %" },
      { rate: 0, label: "Exonéré" },
    ],
  },
  {
    countryCode: "BJ",
    countryLabel: "Bénin (UEMOA)",
    defaultRate: 18,
    rates: [
      { rate: 18, label: "TVA 18 %" },
      { rate: 0, label: "Exonéré" },
    ],
  },
  {
    countryCode: "BF",
    countryLabel: "Burkina Faso (UEMOA)",
    defaultRate: 18,
    rates: [
      { rate: 18, label: "TVA 18 %" },
      { rate: 0, label: "Exonéré" },
    ],
  },
  {
    countryCode: "ML",
    countryLabel: "Mali (UEMOA)",
    defaultRate: 18,
    rates: [
      { rate: 18, label: "TVA 18 %" },
      { rate: 0, label: "Exonéré" },
    ],
  },
  {
    countryCode: "TG",
    countryLabel: "Togo (UEMOA)",
    defaultRate: 18,
    rates: [
      { rate: 18, label: "TVA 18 %" },
      { rate: 0, label: "Exonéré" },
    ],
  },
  {
    countryCode: "CM",
    countryLabel: "Cameroun",
    defaultRate: 19.25,
    rates: [
      { rate: 19.25, label: "TVA 19,25 %" },
      { rate: 0, label: "Exonéré" },
    ],
  },
  {
    countryCode: "MA",
    countryLabel: "Maroc",
    defaultRate: 20,
    rates: [
      { rate: 20, label: "TVA 20 %" },
      { rate: 14, label: "TVA 14 %" },
      { rate: 10, label: "TVA 10 %" },
      { rate: 7, label: "TVA 7 %" },
      { rate: 0, label: "Exonéré" },
    ],
  },
  {
    countryCode: "CH",
    countryLabel: "Suisse",
    defaultRate: 8.1,
    rates: [
      { rate: 8.1, label: "TVA normale 8,1 %" },
      { rate: 2.6, label: "TVA réduite 2,6 %" },
      { rate: 3.8, label: "TVA hébergement 3,8 %" },
      { rate: 0, label: "Exonéré" },
    ],
  },
  {
    countryCode: "FR",
    countryLabel: "France",
    defaultRate: 20,
    rates: [
      { rate: 20, label: "TVA 20 %" },
      { rate: 10, label: "TVA 10 %" },
      { rate: 5.5, label: "TVA 5,5 %" },
      { rate: 2.1, label: "TVA 2,1 %" },
      { rate: 0, label: "Exonéré" },
    ],
  },
  {
    countryCode: "XX",
    countryLabel: "Autre / personnalisé",
    defaultRate: 0,
    rates: [
      { rate: 0, label: "Exonéré / hors taxes" },
      { rate: 5, label: "5 %" },
      { rate: 10, label: "10 %" },
      { rate: 15, label: "15 %" },
      { rate: 18, label: "18 %" },
      { rate: 20, label: "20 %" },
    ],
  },
];

export function getTaxPreset(countryCode: string): CountryTaxPreset {
  return (
    TAX_PRESETS.find((p) => p.countryCode === countryCode) ??
    TAX_PRESETS[TAX_PRESETS.length - 1]
  );
}

export interface TaxableLine {
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountPercent?: number;
}

export interface TaxBreakdownRow {
  rate: number;
  baseHt: number;
  taxAmount: number;
}

export interface DocumentTotals {
  subtotalHt: number;
  taxTotal: number;
  totalTtc: number;
  breakdown: TaxBreakdownRow[];
}

function lineNet(line: TaxableLine): number {
  const gross = line.quantity * line.unitPrice;
  const discount = line.discountPercent
    ? gross * (line.discountPercent / 100)
    : 0;
  return gross - discount;
}

export function computeTotals(
  lines: TaxableLine[],
  taxMode: TaxMode = "exclusive",
): DocumentTotals {
  const byRate = new Map<number, { baseHt: number; taxAmount: number }>();

  for (const line of lines) {
    const net = lineNet(line);
    const rate = line.taxRate ?? 0;
    let baseHt: number;
    let taxAmount: number;

    if (taxMode === "inclusive" && rate > 0) {
      baseHt = net / (1 + rate / 100);
      taxAmount = net - baseHt;
    } else {
      baseHt = net;
      taxAmount = net * (rate / 100);
    }

    const existing = byRate.get(rate) ?? { baseHt: 0, taxAmount: 0 };
    existing.baseHt += baseHt;
    existing.taxAmount += taxAmount;
    byRate.set(rate, existing);
  }

  const breakdown: TaxBreakdownRow[] = [...byRate.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rate, values]) => ({
      rate,
      baseHt: round2(values.baseHt),
      taxAmount: round2(values.taxAmount),
    }));

  const subtotalHt = round2(breakdown.reduce((s, r) => s + r.baseHt, 0));
  const taxTotal = round2(breakdown.reduce((s, r) => s + r.taxAmount, 0));
  const totalTtc = round2(subtotalHt + taxTotal);

  return { subtotalHt, taxTotal, totalTtc, breakdown };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Quick calculator: amount + rate + mode → HT / TVA / TTC */
export function calculateVat(
  amount: number,
  rate: number,
  mode: TaxMode,
): { ht: number; vat: number; ttc: number } {
  if (mode === "inclusive") {
    const ht = rate > 0 ? amount / (1 + rate / 100) : amount;
    const vat = amount - ht;
    return { ht: round2(ht), vat: round2(vat), ttc: round2(amount) };
  }
  const vat = amount * (rate / 100);
  return { ht: round2(amount), vat: round2(vat), ttc: round2(amount + vat) };
}

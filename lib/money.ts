/** Multi-currency registry — default XOF (FCFA) for African market */

export type CurrencyCode =
  | "XOF"
  | "XAF"
  | "EUR"
  | "USD"
  | "GBP"
  | "CHF"
  | "MAD"
  | "NGN"
  | "GHS"
  | "KES"
  | "CAD";

export interface CurrencyInfo {
  code: CurrencyCode;
  label: string;
  symbol: string;
  decimals: number;
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  XOF: {
    code: "XOF",
    label: "Franc CFA (UEMOA)",
    symbol: "F CFA",
    decimals: 0,
    locale: "fr-FR",
  },
  XAF: {
    code: "XAF",
    label: "Franc CFA (CEMAC)",
    symbol: "F CFA",
    decimals: 0,
    locale: "fr-FR",
  },
  EUR: {
    code: "EUR",
    label: "Euro",
    symbol: "€",
    decimals: 2,
    locale: "fr-FR",
  },
  USD: {
    code: "USD",
    label: "Dollar américain",
    symbol: "$",
    decimals: 2,
    locale: "en-US",
  },
  GBP: {
    code: "GBP",
    label: "Livre sterling",
    symbol: "£",
    decimals: 2,
    locale: "en-GB",
  },
  CHF: {
    code: "CHF",
    label: "Franc suisse",
    symbol: "CHF",
    decimals: 2,
    locale: "fr-CH",
  },
  MAD: {
    code: "MAD",
    label: "Dirham marocain",
    symbol: "MAD",
    decimals: 2,
    locale: "fr-MA",
  },
  NGN: {
    code: "NGN",
    label: "Naira nigérian",
    symbol: "₦",
    decimals: 2,
    locale: "en-NG",
  },
  GHS: {
    code: "GHS",
    label: "Cedi ghanéen",
    symbol: "GH₵",
    decimals: 2,
    locale: "en-GH",
  },
  KES: {
    code: "KES",
    label: "Shilling kenyan",
    symbol: "KSh",
    decimals: 2,
    locale: "en-KE",
  },
  CAD: {
    code: "CAD",
    label: "Dollar canadien",
    symbol: "CA$",
    decimals: 2,
    locale: "en-CA",
  },
};

export const DEFAULT_CURRENCY: CurrencyCode = "XOF";

export const CURRENCY_OPTIONS = (
  Object.keys(CURRENCIES) as CurrencyCode[]
).map((code) => ({
  value: code,
  label: `${CURRENCIES[code].label} (${code})`,
}));

export function formatMoney(
  amount: number,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): string {
  const info = CURRENCIES[currency] ?? CURRENCIES[DEFAULT_CURRENCY];
  try {
    return new Intl.NumberFormat(info.locale, {
      style: "currency",
      currency: info.code,
      minimumFractionDigits: info.decimals,
      maximumFractionDigits: info.decimals,
    }).format(amount);
  } catch {
    const formatted = new Intl.NumberFormat(info.locale, {
      minimumFractionDigits: info.decimals,
      maximumFractionDigits: info.decimals,
    }).format(amount);
    return `${formatted} ${info.symbol}`;
  }
}

/** @deprecated Use formatMoney — kept as alias during migration */
export function formatEuro(amount: number): string {
  return formatMoney(amount, "EUR");
}

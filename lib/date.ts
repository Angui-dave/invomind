/** Date helpers — production uses the real clock */

export function today(): Date {
  return new Date();
}

export function todayIso(): string {
  return today().toISOString().slice(0, 10);
}

/** @deprecated Prefer todayIso() — kept for any leftover seed demos */
export const TODAY = todayIso();

export function addDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function monthKey(isoOrDate: string | Date = today()): string {
  const iso =
    typeof isoOrDate === "string"
      ? isoOrDate
      : isoOrDate.toISOString().slice(0, 10);
  return iso.slice(0, 7);
}

export function currentMonthKey(): string {
  return monthKey(today());
}

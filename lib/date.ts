/** Demo clock — single source of “today” for the static seed */

export const TODAY = "2026-08-15";

export function today(): Date {
  return new Date(TODAY);
}

export function todayIso(): string {
  return TODAY;
}

export function addDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function currentMonthKey(): string {
  return monthKey(TODAY);
}

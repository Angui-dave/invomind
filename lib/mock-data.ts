/** @deprecated Prefer `@/lib/data/*` + `@/lib/formatters` — barrel kept for gradual migration */

import { TODAY } from "@/lib/date";

export * from "@/lib/money";
export * from "@/lib/tax";
export * from "@/lib/documents";
export * from "@/lib/date";
export * from "@/lib/data/clients";
export * from "@/lib/data/documents";
export * from "@/lib/data/payments";
export * from "@/lib/data/expenses";
export * from "@/lib/data/suppliers";
export * from "@/lib/data/catalog";
export * from "@/lib/data/settings";
export * from "@/lib/data/reports";
export * from "@/lib/data/derive";
export * from "@/lib/data/conversations";

export function formatDateFr(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatTimeFr(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function relativeDateFr(
  iso: string,
  now = new Date(TODAY),
): string {
  const target = new Date(iso);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  if (Math.abs(diffDays) < 1) return rtf.format(0, "day");
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, "day");
  const diffMonths = Math.round(diffDays / 30);
  return rtf.format(diffMonths, "month");
}

/** Short list timestamp: time today, « Hier », or short date */
export function conversationStampFr(
  iso: string,
  now = new Date(TODAY),
): string {
  const target = new Date(iso);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const targetDay = new Date(target);
  targetDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (targetDay.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return formatTimeFr(iso);
  if (diffDays === -1) return "Hier";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(target);
}

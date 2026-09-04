import { LaravelApiError } from "@/lib/laravel/client";

/** User-facing message for a failed DAL / Laravel API load. */
export function dalErrorMessage(
  error: unknown,
  fallback = "Impossible de charger les données de l’organisation.",
): string {
  if (error instanceof LaravelApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Session expirée ou accès refusé. Reconnectez-vous, puis réessayez.";
    }
    const clean = error.message.replace(/\s*\[[A-Z]+ \/[^\]]+\]\s*$/, "");
    return clean || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

import { LaravelApiError } from "@/lib/laravel/client";

export function actionErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof LaravelApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

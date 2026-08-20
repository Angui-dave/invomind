/**
 * Data source switch.
 *
 * `USE_LARAVEL_API=true` is the production path: Laravel is the source of truth.
 * Mocks are only used when Laravel is disabled.
 */

/**
 * Fail-fast production guards (mock auth + weak session secret must never ship).
 * Call from instrumentation / root layout on the server.
 */
export function assertProductionSecurity(): void {
  if (process.env.NODE_ENV !== "production") return;

  if (process.env.USE_LARAVEL_API !== "true") {
    throw new Error(
      "USE_LARAVEL_API must be true in production (mock auth is disabled).",
    );
  }

  const secret = process.env.SESSION_SECRET ?? "";
  if (secret.length < 32 || secret.includes("dev-session-secret")) {
    throw new Error(
      "SESSION_SECRET must be a strong random value (min 32 chars) in production.",
    );
  }
}

export function isLaravelApiEnabled(): boolean {
  return process.env.USE_LARAVEL_API === "true";
}

/** @deprecated Prefer isLaravelApiEnabled() */
export function useLaravelApi(): boolean {
  return isLaravelApiEnabled();
}

/**
 * In-memory mock data for local demos without Laravel.
 * Forced off when USE_LARAVEL_API is true. Forbidden in production.
 */
export function useMockData(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  if (isLaravelApiEnabled()) {
    return false;
  }
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";
}

export const MOCK_ORG_ID = "org_demo_atelier_diallo";
export const MOCK_USER_ID = "usr_1";
export const MOCK_SESSION_ID = "sess_mock_1";

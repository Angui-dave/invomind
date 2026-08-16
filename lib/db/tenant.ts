import "server-only";

/**
 * Postgres tenant helpers — disabled in mock mode.
 * Laravel will enforce org scoping on the API instead.
 */
export async function withOrg<T>(_fn: (tx: never) => Promise<T>): Promise<T> {
  throw new Error(
    "withOrg() unavailable in mock mode. Use lib/dal/* mock store. See docs/LARAVEL.md",
  );
}

export async function withPortalToken<T>(
  _token: string,
  _fn: (tx: never, orgId: string) => Promise<T>,
): Promise<T> {
  throw new Error(
    "withPortalToken() unavailable in mock mode. Use lib/dal/* mock store.",
  );
}

export async function withSystemTx<T>(_fn: (tx: never) => Promise<T>): Promise<T> {
  throw new Error("withSystemTx() unavailable in mock mode.");
}

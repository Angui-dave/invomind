/**
 * LEGACY — Drizzle / Postgres client used by the pre-Laravel Next data path.
 * Production path: USE_LARAVEL_API=true → Laravel API (see docs/LARAVEL.md).
 * This module throws if imported at runtime; do not use for new features.
 */
import "server-only";

export type Database = never;

export function getDb(): never {
  throw new Error(
    "Drizzle/Postgres client is legacy. Enable USE_LARAVEL_API=true and use lib/laravel/*. See docs/LARAVEL.md",
  );
}

/** @deprecated Prefer getDb() — kept so old imports fail clearly */
export const db = new Proxy(
  {},
  {
    get() {
      throw new Error(
        "Drizzle/Postgres client is legacy. Enable USE_LARAVEL_API=true and use lib/laravel/*. See docs/LARAVEL.md",
      );
    },
  },
) as never;

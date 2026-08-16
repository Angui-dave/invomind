/**
 * Lazy DB client — only used if you opt into Postgres later.
 * Default app path uses mocks and never imports this at runtime.
 */
import "server-only";

export type Database = never;

export function getDb(): never {
  throw new Error(
    "Postgres client disabled while NEXT_PUBLIC_USE_MOCK_DATA=true. See docs/LARAVEL.md",
  );
}

/** @deprecated Prefer getDb() — kept so old imports fail clearly */
export const db = new Proxy(
  {},
  {
    get() {
      throw new Error(
        "Postgres client disabled while NEXT_PUBLIC_USE_MOCK_DATA=true. See docs/LARAVEL.md",
      );
    },
  },
) as never;

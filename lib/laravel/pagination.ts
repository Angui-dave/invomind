/** Unwrap Laravel list payloads: a bare array, or `{ data, meta }` when paginated. */
export function unwrapList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (
    payload !== null &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data: unknown }).data)
  ) {
    return (payload as { data: unknown[] }).data;
  }
  return [];
}

export type ListMeta = {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
};

export function unwrapListMeta(payload: unknown): ListMeta | null {
  if (payload === null || typeof payload !== "object" || !("meta" in payload)) {
    return null;
  }
  const meta = (payload as { meta?: Record<string, unknown> }).meta;
  if (!meta) return null;
  const currentPage = Number(meta.current_page ?? meta.currentPage ?? 1);
  const lastPage = Number(meta.last_page ?? meta.lastPage ?? 1);
  const perPage = Number(meta.per_page ?? meta.perPage ?? 0);
  const total = Number(meta.total ?? 0);
  if (!Number.isFinite(total)) return null;
  return { currentPage, lastPage, perPage, total };
}

/** Next.js redirect()/notFound() throw; never treat them as app errors. */
export function isNextNavigationError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const digest =
    "digest" in error && typeof (error as { digest: unknown }).digest === "string"
      ? (error as { digest: string }).digest
      : "";
  return (
    digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND")
  );
}

export function rethrowNextNavigation(error: unknown): void {
  if (isNextNavigationError(error)) {
    throw error;
  }
}

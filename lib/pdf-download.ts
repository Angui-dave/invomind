export async function downloadPdfFromUrl(url: string): Promise<void> {
  const response = await fetch(url, { cache: "no-store" });
  if (response.status === 409) {
    throw new Error("Le PDF n’est pas encore prêt. Réessayez dans un instant.");
  }
  if (!response.ok) {
    let message = "Téléchargement impossible";
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload?.message) message = payload.message;
    } catch {
      /* ignore non-JSON errors */
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const disposition = response.headers.get("content-disposition");
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  const link = globalThis.document.createElement("a");
  link.href = objectUrl;
  link.download = match?.[1] ?? "document.pdf";
  link.rel = "noopener";
  globalThis.document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

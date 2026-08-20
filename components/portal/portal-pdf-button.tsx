"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadPdfFromUrl } from "@/lib/pdf-download";

type PortalPdfButtonProps = {
  href: string;
  label: string;
  busyLabel?: string;
};

export function PortalPdfButton({
  href,
  label,
  busyLabel = "Préparation du PDF…",
}: PortalPdfButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    setBusy(true);
    try {
      await downloadPdfFromUrl(href);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Téléchargement impossible",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={busy}
      onClick={() => void handleDownload()}
    >
      <FileDown />
      {busy ? busyLabel : label}
    </Button>
  );
}

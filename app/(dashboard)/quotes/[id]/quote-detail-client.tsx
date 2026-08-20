"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRightLeft, Check, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { QuoteForm } from "@/components/quotes/quote-form";
import { Button } from "@/components/ui/button";
import { updateQuoteStatus } from "@/lib/actions/documents";
import type { Client } from "@/lib/data/clients";
import type { CatalogItem } from "@/lib/data/catalog";
import type { OrgSettings } from "@/lib/data/settings";
import type { BusinessDocument } from "@/lib/documents";

type QuoteDetailClientProps = {
  document: BusinessDocument;
  clients: Client[];
  catalogItems: CatalogItem[];
  orgSettings: OrgSettings;
  existingNumbers: BusinessDocument[];
};

export function QuoteDetailClient({
  document,
  clients,
  catalogItems,
  orgSettings,
  existingNumbers,
}: QuoteDetailClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(document.status);

  function setQuoteStatus(next: "accepted" | "refused" | "expired") {
    startTransition(async () => {
      const result = await updateQuoteStatus(document.id, next);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setStatus(next);
      toast.success(
        next === "accepted"
          ? "Devis accepté"
          : next === "refused"
            ? "Devis refusé"
            : "Devis marqué expiré",
      );
      router.refresh();
    });
  }

  const canTransition = status === "sent" || status === "accepted" || status === "refused" || status === "expired";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {canTransition && status === "sent" && (
          <>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={pending}
              onClick={() => setQuoteStatus("accepted")}
            >
              <Check className="size-4" aria-hidden />
              Accepter
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={pending}
              onClick={() => setQuoteStatus("refused")}
            >
              <X className="size-4" aria-hidden />
              Refuser
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={pending}
              onClick={() => setQuoteStatus("expired")}
            >
              <Clock className="size-4" aria-hidden />
              Expiré
            </Button>
          </>
        )}
        {(status === "accepted" || status === "sent") && (
          <Button
            type="button"
            className="rounded-full bg-ledger text-paper hover:bg-ledger/90"
            onClick={() =>
              router.push(`/invoices/new?fromQuote=${document.id}`)
            }
          >
            <ArrowRightLeft className="size-4" aria-hidden />
            Convertir en facture
          </Button>
        )}
      </div>
      <QuoteForm
        mode="edit"
        document={{ ...document, status }}
        clients={clients}
        catalogItems={catalogItems}
        orgSettings={orgSettings}
        existingNumbers={existingNumbers}
      />
    </div>
  );
}

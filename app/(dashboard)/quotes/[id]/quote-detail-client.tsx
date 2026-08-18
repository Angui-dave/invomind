"use client";

import { useRouter } from "next/navigation";
import { ArrowRightLeft } from "lucide-react";
import { QuoteForm } from "@/components/quotes/quote-form";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="space-y-4">
      {(document.status === "accepted" || document.status === "sent") && (
        <div className="flex justify-end">
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
        </div>
      )}
      <QuoteForm
        mode="edit"
        document={document}
        clients={clients}
        catalogItems={catalogItems}
        orgSettings={orgSettings}
        existingNumbers={existingNumbers}
      />
    </div>
  );
}

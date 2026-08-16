"use client";

import { use } from "react";
import { notFound, useRouter } from "next/navigation";
import { ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { Button } from "@/components/ui/button";
import { getDocumentById } from "@/lib/mock-data";

export default function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const document = getDocumentById(id);

  if (!document || document.kind !== "quote") notFound();

  function handleConvert() {
    if (!document) return;
    toast.success(`Conversion de ${document.number}…`);
    router.push(`/invoices/new?fromQuote=${document.id}`);
  }

  return (
    <div className="space-y-4">
      {(document.status === "accepted" || document.status === "sent") && (
        <div className="flex justify-end">
          <Button
            type="button"
            className="bg-ledger text-paper hover:bg-ledger/90"
            onClick={handleConvert}
          >
            <ArrowRightLeft className="size-4" aria-hidden />
            Convertir en facture
          </Button>
        </div>
      )}
      <InvoiceForm mode="edit" document={document} />
    </div>
  );
}

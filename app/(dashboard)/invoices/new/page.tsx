import type { Metadata } from "next";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import {
  CLIENTS,
  convertQuoteToInvoice,
  createCreditNoteFromInvoice,
  DOCUMENTS,
  getDocumentById,
} from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Nouvelle facture",
};

type SearchParams = Promise<{
  fromQuote?: string;
  creditOf?: string;
}>;

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  let document = undefined;
  let kind: "invoice" | "credit_note" = "invoice";

  if (params.fromQuote) {
    const quote = getDocumentById(params.fromQuote);
    if (quote?.kind === "quote") {
      const client = CLIENTS.find((c) => c.id === quote.clientId);
      document = convertQuoteToInvoice(
        quote,
        DOCUMENTS,
        client?.paymentTermDays ?? 30,
      );
    }
  } else if (params.creditOf) {
    const invoice = getDocumentById(params.creditOf);
    if (invoice?.kind === "invoice") {
      document = createCreditNoteFromInvoice(invoice, DOCUMENTS);
      kind = "credit_note";
    }
  }

  return (
    <InvoiceForm
      mode="new"
      kind={kind}
      document={document}
      prefilledFromConversion={Boolean(document)}
    />
  );
}

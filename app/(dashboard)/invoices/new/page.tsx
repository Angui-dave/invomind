import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { listCatalogItems } from "@/lib/dal/catalog";
import {
  getCreditNotes,
  getDocumentById,
  getInvoices,
  listClients,
} from "@/lib/dal/documents";
import { getOrgSettings } from "@/lib/dal/settings";
import { DEFAULT_ORG_SETTINGS } from "@/lib/data/settings";
import { isLaravelApiEnabled } from "@/lib/config";
import { convertQuote } from "@/lib/actions/documents";
import {
  convertQuoteToInvoice,
  createCreditNoteFromInvoice,
} from "@/lib/documents";

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
  const laravel = isLaravelApiEnabled();

  // Laravel: convert via API then open the new invoice.
  if (params.fromQuote && laravel) {
    const result = await convertQuote(params.fromQuote);
    if (result.ok && result.id) {
      redirect(`/invoices/${result.id}`);
    }
  }

  // Credit notes unavailable on Laravel — stay on invoices list.
  if (params.creditOf && laravel) {
    redirect("/invoices");
  }

  const [clients, catalogItems, settings, invoices, creditNotes] =
    await Promise.all([
      listClients(),
      listCatalogItems(),
      getOrgSettings(),
      getInvoices(),
      getCreditNotes(),
    ]);

  let document = undefined;
  let kind: "invoice" | "credit_note" = "invoice";
  const existing = [...invoices, ...creditNotes];

  if (params.fromQuote && !laravel) {
    const quote = await getDocumentById(params.fromQuote);
    if (quote?.kind === "quote") {
      const client = clients.find((c) => c.id === quote.clientId);
      document = convertQuoteToInvoice(
        quote,
        invoices,
        client?.paymentTermDays ?? 30,
      );
    }
  } else if (params.creditOf && !laravel) {
    const invoice = await getDocumentById(params.creditOf);
    if (invoice?.kind === "invoice") {
      document = createCreditNoteFromInvoice(invoice, creditNotes);
      kind = "credit_note";
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={kind === "credit_note" ? "Nouvel avoir" : "Nouvelle facture"}
        backHref="/invoices"
        backLabel="Factures"
      />
      <InvoiceForm
        mode="new"
        kind={kind}
        document={document}
        prefilledFromConversion={Boolean(document)}
        clients={clients}
        catalogItems={catalogItems}
        orgSettings={settings ?? DEFAULT_ORG_SETTINGS}
        existingNumbers={existing.filter((d) => d.kind === kind)}
        creditNotesUnavailable={laravel}
        pdfUnavailable={laravel}
      />
    </div>
  );
}

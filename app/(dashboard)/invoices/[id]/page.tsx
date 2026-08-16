import type { Metadata } from "next";
import { notFound } from "next/navigation";
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

export const metadata: Metadata = {
  title: "Modifier une facture",
};

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [document, clients, catalogItems, settings, invoices, creditNotes] =
    await Promise.all([
      getDocumentById(id),
      listClients(),
      listCatalogItems(),
      getOrgSettings(),
      getInvoices(),
      getCreditNotes(),
    ]);

  if (
    !document ||
    (document.kind !== "invoice" && document.kind !== "credit_note")
  ) {
    notFound();
  }

  const existingNumbers =
    document.kind === "invoice" ? invoices : creditNotes;

  return (
    <InvoiceForm
      mode="edit"
      document={document}
      clients={clients}
      catalogItems={catalogItems}
      orgSettings={settings ?? DEFAULT_ORG_SETTINGS}
      existingNumbers={existingNumbers}
    />
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { getDocumentById } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Modifier une facture",
};

export default async function EditInvoicePage(
  props: PageProps<"/invoices/[id]">,
) {
  const { id } = await props.params;
  const document = getDocumentById(id);
  if (!document || (document.kind !== "invoice" && document.kind !== "credit_note")) {
    notFound();
  }
  return <InvoiceForm mode="edit" document={document} />;
}

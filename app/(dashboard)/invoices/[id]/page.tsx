import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { getInvoiceById } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Modifier une facture",
};

export default async function EditInvoicePage(
  props: PageProps<"/invoices/[id]">,
) {
  const { id } = await props.params;
  const invoice = getInvoiceById(id);
  if (!invoice) notFound();
  return <InvoiceForm mode="edit" invoice={invoice} />;
}

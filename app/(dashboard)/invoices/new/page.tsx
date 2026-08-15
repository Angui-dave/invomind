import type { Metadata } from "next";
import { InvoiceForm } from "@/components/invoices/invoice-form";

export const metadata: Metadata = {
  title: "Nouvelle facture",
};

export default function NewInvoicePage() {
  return <InvoiceForm mode="new" />;
}

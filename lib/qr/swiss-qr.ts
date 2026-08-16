/**
 * Swiss QR-bill data builder.
 * Uses swissqrbill for SVG rendering when country === CH.
 */

import type { BusinessDocument } from "@/lib/documents";
import type { OrgSettings } from "@/lib/data/settings";

export interface SwissQrBillData {
  currency: "CHF" | "EUR";
  amount: number;
  creditor: {
    account: string;
    name: string;
    address: string;
    zip: number | string;
    city: string;
    country: string;
  };
  debtor?: {
    name: string;
    address: string;
    zip: number | string;
    city: string;
    country: string;
  };
  reference?: string;
  message?: string;
}

export function buildSwissQrData(
  doc: BusinessDocument,
  org: OrgSettings,
  client?: {
    name: string;
    address?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  },
): SwissQrBillData {
  const account = (org.qrIban || org.iban).replace(/\s+/g, "");
  return {
    currency: doc.currency === "EUR" ? "EUR" : "CHF",
    amount: doc.total,
    creditor: {
      account,
      name: org.companyName,
      address: org.address,
      zip: org.postalCode || "8000",
      city: org.city,
      country: "CH",
    },
    debtor: client
      ? {
          name: client.name,
          address: client.address ?? "",
          zip: client.postalCode ?? "",
          city: client.city ?? "",
          country: client.country ?? "CH",
        }
      : undefined,
    message: `Facture ${doc.number}`,
  };
}

export function isValidIban(iban: string): boolean {
  const cleaned = iban.replace(/\s+/g, "").toUpperCase();
  if (cleaned.length < 15 || cleaned.length > 34) return false;
  return /^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleaned);
}

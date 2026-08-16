import type { CurrencyCode } from "@/lib/money";

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  currency: CurrencyCode;
  taxRate: number;
  unit: string;
  kind: "service" | "product";
}

export const CATALOG_ITEMS: CatalogItem[] = [
  {
    id: "cat_item_1",
    name: "Journée de conseil",
    description: "Prestation de conseil stratégique — journée",
    unitPrice: 150_000,
    currency: "XOF",
    taxRate: 18,
    unit: "jour",
    kind: "service",
  },
  {
    id: "cat_item_2",
    name: "Heure de développement",
    description: "Développement web / mobile",
    unitPrice: 45_000,
    currency: "XOF",
    taxRate: 18,
    unit: "heure",
    kind: "service",
  },
  {
    id: "cat_item_3",
    name: "Maintenance mensuelle",
    description: "Forfait maintenance et support",
    unitPrice: 180_000,
    currency: "XOF",
    taxRate: 18,
    unit: "mois",
    kind: "service",
  },
  {
    id: "cat_item_4",
    name: "Pack identité visuelle",
    description: "Logo, charte graphique, déclinaisons",
    unitPrice: 850_000,
    currency: "XOF",
    taxRate: 18,
    unit: "forfait",
    kind: "service",
  },
  {
    id: "cat_item_5",
    name: "Formation — demi-journée",
    description: "Session de formation en présentiel ou distanciel",
    unitPrice: 200_000,
    currency: "XOF",
    taxRate: 18,
    unit: "session",
    kind: "service",
  },
];

import { listCatalogItems } from "@/lib/dal/catalog";
import { getOrgSettings } from "@/lib/dal/settings";
import { CatalogPageClient } from "./catalog-client";

export default async function CatalogPage() {
  const [items, settings] = await Promise.all([
    listCatalogItems(),
    getOrgSettings(),
  ]);

  return (
    <CatalogPageClient
      initialItems={items}
      defaultCurrency={settings?.defaultCurrency ?? "XOF"}
    />
  );
}

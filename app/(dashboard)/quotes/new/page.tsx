import { PageHeader } from "@/components/dashboard/page-header";
import { QuoteForm } from "@/components/quotes/quote-form";
import { listCatalogItems } from "@/lib/dal/catalog";
import { getQuotes, listClients } from "@/lib/dal/documents";
import { getOrgSettings } from "@/lib/dal/settings";
import { DEFAULT_ORG_SETTINGS } from "@/lib/data/settings";

export default async function NewQuotePage() {
  const [clients, catalogItems, settings, quotes] = await Promise.all([
    listClients(),
    listCatalogItems(),
    getOrgSettings(),
    getQuotes(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouveau devis"
        backHref="/quotes"
        backLabel="Devis"
      />
      <QuoteForm
        mode="new"
        clients={clients}
        catalogItems={catalogItems}
        orgSettings={settings ?? DEFAULT_ORG_SETTINGS}
        existingNumbers={quotes}
      />
    </div>
  );
}

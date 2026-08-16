import { notFound } from "next/navigation";
import { listCatalogItems } from "@/lib/dal/catalog";
import {
  getDocumentById,
  getQuotes,
  listClients,
} from "@/lib/dal/documents";
import { getOrgSettings } from "@/lib/dal/settings";
import { DEFAULT_ORG_SETTINGS } from "@/lib/data/settings";
import { QuoteDetailClient } from "./quote-detail-client";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [document, clients, catalogItems, settings, quotes] = await Promise.all(
    [
      getDocumentById(id),
      listClients(),
      listCatalogItems(),
      getOrgSettings(),
      getQuotes(),
    ],
  );

  if (!document || document.kind !== "quote") notFound();

  return (
    <QuoteDetailClient
      document={document}
      clients={clients}
      catalogItems={catalogItems}
      orgSettings={settings ?? DEFAULT_ORG_SETTINGS}
      existingNumbers={quotes}
    />
  );
}

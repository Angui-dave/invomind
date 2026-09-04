import { getQuotes } from "@/lib/dal/documents";
import { dalErrorMessage } from "@/lib/dal/load-error";
import { DalErrorBanner } from "@/components/dal-error-banner";
import type { QuoteStatus } from "@/lib/mock-data";
import type { BusinessDocument } from "@/lib/documents";
import { QuotesPageClient } from "./quotes-client";

type SearchParams = Promise<{
  status?: string;
}>;

const QUOTE_STATUSES: QuoteStatus[] = [
  "draft",
  "sent",
  "accepted",
  "refused",
  "expired",
];

function parseQuoteStatusFilter(value?: string): "all" | QuoteStatus {
  if (value && QUOTE_STATUSES.includes(value as QuoteStatus)) {
    return value as QuoteStatus;
  }
  return "all";
}

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  let quotes: BusinessDocument[] = [];
  let loadError: string | null = null;
  try {
    quotes = await getQuotes();
  } catch (error) {
    loadError = dalErrorMessage(error);
  }

  return (
    <>
      {loadError ? <DalErrorBanner message={loadError} /> : null}
      <QuotesPageClient
        quotes={quotes}
        status={parseQuoteStatusFilter(params.status)}
      />
    </>
  );
}

import { getQuotes } from "@/lib/dal/documents";
import type { QuoteStatus } from "@/lib/mock-data";
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
  const quotes = await getQuotes();
  return (
    <QuotesPageClient
      quotes={quotes}
      status={parseQuoteStatusFilter(params.status)}
    />
  );
}

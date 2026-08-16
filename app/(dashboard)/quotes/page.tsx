import { getQuotes } from "@/lib/dal/documents";
import { QuotesPageClient } from "./quotes-client";

export default async function QuotesPage() {
  const quotes = await getQuotes();
  return <QuotesPageClient quotes={quotes} />;
}

import Link from "next/link";
import { Plus } from "lucide-react";
import { getQuotes } from "@/lib/dal/documents";
import { dalErrorMessage } from "@/lib/dal/load-error";
import { DalErrorBanner } from "@/components/dal-error-banner";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import type { QuoteStatus } from "@/lib/documents";
import type { BusinessDocument } from "@/lib/documents";
import { cn } from "@/lib/utils";
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
    <div className="space-y-6">
      <PageHeader
        title="Devis"
        description="Propositions commerciales"
        actions={
          <Link
            href="/quotes/new"
            className={cn(
              buttonVariants(),
              "h-9 rounded-full bg-ledger text-paper hover:bg-ledger/90",
            )}
          >
            <Plus className="size-4" aria-hidden />
            Nouveau devis
          </Link>
        }
      />
      {loadError ? <DalErrorBanner message={loadError} /> : null}
      <QuotesPageClient
        quotes={quotes}
        status={parseQuoteStatusFilter(params.status)}
      />
    </div>
  );
}

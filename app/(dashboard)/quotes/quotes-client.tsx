"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Plus } from "lucide-react";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDateFr,
  formatMoney,
  QUOTE_STATUS_LABELS,
  type BusinessDocument,
  type QuoteStatus,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | QuoteStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "draft", label: QUOTE_STATUS_LABELS.draft },
  { value: "sent", label: QUOTE_STATUS_LABELS.sent },
  { value: "accepted", label: QUOTE_STATUS_LABELS.accepted },
  { value: "refused", label: QUOTE_STATUS_LABELS.refused },
  { value: "expired", label: QUOTE_STATUS_LABELS.expired },
];

type QuotesPageClientProps = {
  quotes: BusinessDocument[];
};

export function QuotesPageClient({ quotes }: QuotesPageClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list: BusinessDocument[] = [...quotes];
    if (status !== "all") list = list.filter((q) => q.status === status);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (item) =>
          item.clientName.toLowerCase().includes(q) ||
          item.number.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  }, [quotes, status, query]);

  function handleConvert(quote: BusinessDocument) {
    router.push(`/invoices/new?fromQuote=${quote.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">Devis</h1>
          <p className="mt-1 text-sm text-ink/60">{filtered.length} devis</p>
        </div>
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
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={status}
          onValueChange={(value) => setStatus(value as StatusFilter)}
        >
          <TabsList
            variant="default"
            className="h-auto w-full flex-wrap justify-start rounded-full bg-muted/80 p-1"
          >
            {FILTERS.map((filter) => (
              <TabsTrigger
                key={filter.value}
                value={filter.value}
                className="rounded-full text-xs sm:text-sm"
              >
                {filter.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher…"
          className="sm:max-w-xs"
        />
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-line bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Client</TableHead>
              <TableHead>Numéro</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Validité</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-ink/55"
                >
                  Aucun devis. Créez-en un pour démarrer.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell>
                    <Link
                      href={`/quotes/${quote.id}`}
                      className="font-medium text-ink hover:text-ledger"
                    >
                      {quote.clientName}
                    </Link>
                  </TableCell>
                  <TableCell className="num text-ink/70">
                    {quote.number}
                  </TableCell>
                  <TableCell className="num text-right font-medium">
                    {formatMoney(quote.total, quote.currency)}
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={quote.status} />
                  </TableCell>
                  <TableCell className="num text-ink/70">
                    {formatDateFr(quote.dueDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    {(quote.status === "accepted" || quote.status === "sent") && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleConvert(quote)}
                      >
                        <ArrowRightLeft className="size-3" aria-hidden />
                        → Facture
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <li className="rounded-2xl border border-line bg-card px-4 py-8 text-center text-sm text-ink/55">
            Aucun devis. Créez-en un pour démarrer.
          </li>
        ) : (
          filtered.map((quote) => (
            <li
              key={quote.id}
              className="rounded-2xl border border-line bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/quotes/${quote.id}`}
                  className="min-w-0 font-medium text-ink hover:text-ledger"
                >
                  {quote.clientName}
                  <span className="mt-0.5 block num text-xs text-ink/50">
                    {quote.number}
                  </span>
                </Link>
                <InvoiceStatusBadge status={quote.status} />
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="num text-lg font-semibold">
                  {formatMoney(quote.total, quote.currency)}
                </p>
                {(quote.status === "accepted" || quote.status === "sent") && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-full text-xs"
                    onClick={() => handleConvert(quote)}
                  >
                    → Facture
                  </Button>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

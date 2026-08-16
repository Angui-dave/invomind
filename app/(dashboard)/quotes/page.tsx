"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightLeft, Plus } from "lucide-react";
import { toast } from "sonner";
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
  DOCUMENTS,
  formatDateFr,
  formatMoney,
  QUOTE_STATUS_LABELS,
  type BusinessDocument,
  type QuoteStatus,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type StatusFilter = "all" | QuoteStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "draft", label: QUOTE_STATUS_LABELS.draft },
  { value: "sent", label: QUOTE_STATUS_LABELS.sent },
  { value: "accepted", label: QUOTE_STATUS_LABELS.accepted },
  { value: "refused", label: QUOTE_STATUS_LABELS.refused },
  { value: "expired", label: QUOTE_STATUS_LABELS.expired },
];

export default function QuotesPage() {
  const router = useRouter();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [quotes, setQuotes] = useState(
    () => DOCUMENTS.filter((d) => d.kind === "quote"),
  );

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
    toast.success(`Conversion de ${quote.number}…`);
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === quote.id ? { ...q, status: "accepted" as const } : q,
      ),
    );
    router.push(`/invoices/new?fromQuote=${quote.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">Devis</h1>
          <p className="mt-1 text-sm text-ink/60">
            {filtered.length} devis
          </p>
        </div>
        <Link
          href="/quotes/new"
          className={cn(
            buttonVariants(),
            "h-9 bg-ledger text-paper hover:bg-ledger/90",
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
          <TabsList variant="line" className="h-auto w-full flex-wrap justify-start">
            {FILTERS.map((filter) => (
              <TabsTrigger
                key={filter.value}
                value={filter.value}
                className="text-xs sm:text-sm"
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

      <div className="rounded-sm border border-line bg-paper">
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
                  <TableCell className="num text-ink/70">{quote.number}</TableCell>
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
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpDown, FileMinus2, Plus } from "lucide-react";
import { toast } from "sonner";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { InvoiceTrackingCell } from "@/components/invoice-tracking-cell";
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
  getCreditNotes,
  getInvoices,
  INVOICE_STATUS_LABELS,
  type BusinessDocument,
  type InvoiceStatus,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type KindTab = "invoices" | "credit_notes";
type StatusFilter = "all" | InvoiceStatus;
type SortKey = "client" | "amount" | "dueDate";
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 8;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "draft", label: INVOICE_STATUS_LABELS.draft },
  { value: "sent", label: INVOICE_STATUS_LABELS.sent },
  { value: "partially_paid", label: INVOICE_STATUS_LABELS.partially_paid },
  { value: "paid", label: INVOICE_STATUS_LABELS.paid },
  { value: "overdue", label: INVOICE_STATUS_LABELS.overdue },
];

export default function InvoicesPage() {
  const router = useRouter();
  const [kindTab, setKindTab] = useState<KindTab>("invoices");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "dueDate",
    direction: "desc",
  });
  const [page, setPage] = useState(1);

  const source =
    kindTab === "invoices" ? getInvoices() : getCreditNotes();

  const filtered = useMemo(() => {
    let list: BusinessDocument[] = [...source];
    if (kindTab === "invoices" && status !== "all") {
      list = list.filter((inv) => inv.status === status);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (inv) =>
          inv.clientName.toLowerCase().includes(q) ||
          inv.number.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sort.key === "client") cmp = a.clientName.localeCompare(b.clientName);
      if (sort.key === "amount") cmp = a.total - b.total;
      if (sort.key === "dueDate") cmp = a.dueDate.localeCompare(b.dueDate);
      return sort.direction === "asc" ? cmp : -cmp;
    });
    return list;
  }, [source, kindTab, status, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
    setPage(1);
  }

  function handleCreditNote(invoice: BusinessDocument) {
    toast.success("Préparation de l’avoir…");
    router.push(`/invoices/new?creditOf=${invoice.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">
            Factures
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            {filtered.length} document{filtered.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/invoices/new"
          className={cn(
            buttonVariants(),
            "h-9 bg-ledger text-paper hover:bg-ledger/90",
          )}
        >
          <Plus className="size-4" aria-hidden />
          Nouvelle facture
        </Link>
      </div>

      <Tabs
        value={kindTab}
        onValueChange={(value) => {
          setKindTab(value as KindTab);
          setPage(1);
        }}
      >
        <TabsList variant="line">
          <TabsTrigger value="invoices">Factures</TabsTrigger>
          <TabsTrigger value="credit_notes">Avoirs</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {kindTab === "invoices" && (
          <Tabs
            value={status}
            onValueChange={(value) => {
              setStatus(value as StatusFilter);
              setPage(1);
            }}
          >
            <TabsList
              variant="line"
              className="h-auto w-full flex-wrap justify-start"
            >
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
        )}
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Rechercher un client ou un numéro"
          className="sm:max-w-xs"
          aria-label="Rechercher un client ou un numéro"
        />
      </div>

      <div className="rounded-sm border border-line bg-paper">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>
                <SortButton
                  label="Client"
                  active={sort.key === "client"}
                  onClick={() => toggleSort("client")}
                />
              </TableHead>
              <TableHead>Numéro</TableHead>
              <TableHead className="text-right">
                <SortButton
                  label="Montant"
                  active={sort.key === "amount"}
                  onClick={() => toggleSort("amount")}
                  className="ml-auto"
                />
              </TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>
                <SortButton
                  label="Échéance"
                  active={sort.key === "dueDate"}
                  onClick={() => toggleSort("dueDate")}
                />
              </TableHead>
              <TableHead>
                {kindTab === "invoices" ? "Suivi" : "Actions"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-ink/55"
                >
                  Aucun document ne correspond à ces critères.
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="font-medium text-ink hover:text-ledger"
                    >
                      {invoice.clientName}
                    </Link>
                  </TableCell>
                  <TableCell className="num text-ink/70">
                    {invoice.number}
                  </TableCell>
                  <TableCell className="num text-right font-medium">
                    {formatMoney(invoice.total, invoice.currency)}
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell className="num text-ink/70">
                    {formatDateFr(invoice.dueDate)}
                  </TableCell>
                  <TableCell>
                    {kindTab === "invoices" ? (
                      <div className="flex items-center gap-2">
                        <InvoiceTrackingCell invoice={invoice} />
                        {(invoice.status === "paid" ||
                          invoice.status === "sent" ||
                          invoice.status === "partially_paid") && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-7 text-ink/45 hover:text-ink"
                            title="Créer un avoir"
                            onClick={() => handleCreditNote(invoice)}
                          >
                            <FileMinus2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-ink/50">
                        {invoice.sourceDocumentId
                          ? `Lié à facture`
                          : "—"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="num text-sm text-ink/55">
          Page {currentPage} / {pageCount}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Précédent
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}

function SortButton({
  label,
  active,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 text-left transition-ledger hover:text-ink",
        active ? "text-ink" : "text-muted-foreground",
        className,
      )}
    >
      {label}
      <ArrowUpDown className="size-3.5 opacity-60" aria-hidden />
    </button>
  );
}

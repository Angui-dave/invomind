import Link from "next/link";
import {
  Plus,
  TrendingUp,
  Clock,
  AlertCircle,
  Users,
  ArrowRight,
  FileText,
  ShoppingCart,
  ChevronRight,
} from "lucide-react";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { InvoiceTrackingCell } from "@/components/invoice-tracking-cell";
import { EmptyDashboard } from "@/components/dashboard/empty-dashboard";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StatusDonutChart } from "@/components/dashboard/status-donut-chart";
import { TopClientsChart } from "@/components/dashboard/top-clients-chart";
import { StatCard } from "@/components/stat-card";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { verifySession } from "@/lib/dal/session";
import {
  getInvoices,
  overdueInvoiceCount,
  pendingInvoiceCount,
} from "@/lib/dal/documents";
import { activeProspectsValue } from "@/lib/dal/prospects";
import {
  monthRevenue,
  revenueByMonth,
  topClients,
} from "@/lib/dal/reports";
import { currentMonthKey, monthKey } from "@/lib/date";
import {
  formatDateFr,
  formatMoney,
  DEFAULT_CURRENCY,
  TODAY,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const SHOW_EMPTY_STATE = false;
const BILLABLE_STATUSES = new Set([
  "sent",
  "partially_paid",
  "paid",
  "overdue",
]);

export default async function DashboardPage() {
  const session = await verifySession();
  const [
    pipeline,
    overdue,
    pending,
    invoices,
    revenue,
    series3,
    series6,
    series12,
    top,
  ] = await Promise.all([
    activeProspectsValue(),
    overdueInvoiceCount(),
    pendingInvoiceCount(),
    getInvoices(),
    monthRevenue(),
    revenueByMonth(3),
    revenueByMonth(6),
    revenueByMonth(12),
    topClients(5),
  ]);

  const recent = [...invoices]
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
    .slice(0, 5);

  const statusCounts = invoices.reduce(
    (acc, inv) => {
      acc[inv.status] = (acc[inv.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const monthKeyVal = currentMonthKey();
  const billedThisMonth = invoices
    .filter(
      (inv) =>
        monthKey(inv.issueDate) === monthKeyVal &&
        BILLABLE_STATUSES.has(inv.status),
    )
    .reduce((sum, inv) => sum + inv.total, 0);
  const collectionRate =
    billedThisMonth > 0
      ? Math.min(100, Math.round((revenue / billedThisMonth) * 100))
      : revenue > 0
        ? 100
        : 0;

  const monthLabel = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(TODAY));

  const firstName = session.user.name.split(" ")[0];

  return (
    <div className="space-y-8 pb-8">
      <header className="dashboard-hero-bg relative overflow-hidden rounded-2xl border border-line/80 bg-card/85 p-5 shadow-sm backdrop-blur-md sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-brass/25 bg-brass/10 px-3 py-1 text-xs font-medium text-brass">
              <span className="relative flex size-2">
                <span className="pulse-dot absolute inline-flex size-full rounded-full bg-brass opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-brass" />
              </span>
              <span className="capitalize">{monthLabel}</span>
              <span className="text-brass/70">· trésorerie en temps réel</span>
            </p>
            <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-ink">
              Bonjour {firstName}
            </h1>
            <p className="mt-1.5 text-sm text-ink/65">
              Voici l’état de votre trésorerie et vos activités récentes.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                href="/quotes/new"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-9 rounded-full border-line bg-paper/70",
                )}
              >
                <FileText className="size-4" />
                Nouveau devis
              </Link>
              <Link
                href="/expenses"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-9 rounded-full border-line bg-paper/70",
                )}
              >
                <ShoppingCart className="size-4" />
                Saisir une dépense
              </Link>
              <Link
                href="/invoices/new"
                className={cn(
                  buttonVariants(),
                  "glow-cta h-9 rounded-full bg-ledger px-4 text-paper hover:bg-ledger/90",
                )}
              >
                <Plus className="size-4" />
                Nouvelle facture
              </Link>
            </div>
          </div>

          <div className="glass-card w-full max-w-sm shrink-0 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-ink/70">
                Objectif trésorerie
              </p>
              <p className="num text-sm font-semibold text-brass">
                {collectionRate}%
              </p>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className="progress-brand h-full rounded-full transition-all"
                style={{ width: `${collectionRate}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-ink/50">
              Encaissé ce mois ·{" "}
              <span className="num font-medium text-ink/70">
                {formatMoney(revenue, DEFAULT_CURRENCY)}
              </span>
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenu du mois"
          tone="brass"
          icon={<TrendingUp size={20} />}
          value={
            <span className="num text-brass">
              {formatMoney(revenue, DEFAULT_CURRENCY)}
            </span>
          }
          trend="+12% vs mois dernier"
        />
        <StatCard
          label="Factures en attente"
          tone="amber"
          icon={<Clock size={20} />}
          value={<span className="num">{pending}</span>}
        />
        <StatCard
          label="Factures en retard"
          tone={overdue > 0 ? "brick" : "default"}
          icon={<AlertCircle size={20} />}
          value={
            <span className={cn("num", overdue > 0 && "text-brick")}>
              {overdue}
            </span>
          }
        />
        <StatCard
          label="Pipeline prospects"
          tone="ledger"
          icon={<Users size={20} />}
          value={
            <span className="num text-brass">
              {formatMoney(pipeline.total, DEFAULT_CURRENCY)}
            </span>
          }
          hint={`${pipeline.count} prospects actifs`}
          trend="+8% vs mois dernier"
        />
      </section>

      {SHOW_EMPTY_STATE || invoices.length === 0 ? (
        <EmptyDashboard />
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RevenueChart
                seriesByPeriod={{
                  "3": series3,
                  "6": series6,
                  "12": series12,
                }}
              />
            </div>
            <StatusDonutChart counts={statusCounts} />
          </section>

          <TopClientsChart clients={top} />

          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-serif text-xl font-semibold text-ink">
                Dernières factures
              </h2>
              <Link
                href="/invoices"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "font-medium text-ledger",
                )}
              >
                Voir tout
                <ArrowRight className="ml-1.5" size={16} />
              </Link>
            </div>
            <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-line hover:bg-transparent">
                    <TableHead className="w-[22%] font-medium text-ink/70">
                      Client
                    </TableHead>
                    <TableHead className="font-medium text-ink/70">
                      Numéro
                    </TableHead>
                    <TableHead className="text-right font-medium text-ink/70">
                      Montant
                    </TableHead>
                    <TableHead className="font-medium text-ink/70">
                      Statut
                    </TableHead>
                    <TableHead className="font-medium text-ink/70">
                      Échéance
                    </TableHead>
                    <TableHead className="text-right font-medium text-ink/70">
                      Suivi
                    </TableHead>
                    <TableHead className="w-10">
                      <span className="sr-only">Ouvrir</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className="group border-line transition-colors hover:bg-ledger/5"
                    >
                      <TableCell>
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="font-medium text-ink transition-colors hover:text-ledger"
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
                      <TableCell className="text-right">
                        <div className="inline-flex justify-end">
                          <InvoiceTrackingCell invoice={invoice} />
                        </div>
                      </TableCell>
                      <TableCell className="pr-3">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          aria-label={`Ouvrir la facture ${invoice.number}`}
                          className="inline-flex size-8 items-center justify-center rounded-full text-ink/0 transition-ledger group-hover:bg-ledger/10 group-hover:text-ledger"
                        >
                          <ChevronRight className="size-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

import Link from "next/link";
import { Plus, TrendingUp, Clock, AlertCircle, Users, ArrowRight } from "lucide-react";
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
import {
  formatDateFr,
  formatMoney,
  DEFAULT_CURRENCY,
  TODAY,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const SHOW_EMPTY_STATE = false;

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

  const monthLabel = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(TODAY));

  const firstName = session.user.name.split(" ")[0];

  return (
    <div className="space-y-10 pb-8">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">
            Bonjour {firstName}
          </h1>
          <p className="mt-2 capitalize text-sm font-medium text-ink/60">{monthLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/clients"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            <Users className="mr-2" size={18} />
            Nouveau client
          </Link>
          <Link
            href="/invoices/new"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-ledger text-paper hover:bg-ledger/90",
            )}
          >
            <Plus className="mr-2" size={18} />
            Nouvelle facture
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenu du mois"
          icon={<TrendingUp size={20} />}
          value={
            <span className="num text-brass">{formatMoney(revenue, DEFAULT_CURRENCY)}</span>
          }
        />
        <StatCard
          label="Factures en attente"
          icon={<Clock size={20} />}
          value={<span className="num">{pending}</span>}
        />
        <StatCard
          label="Factures en retard"
          icon={<AlertCircle size={20} className={overdue > 0 ? "text-brick" : ""} />}
          value={
            <span className={`num ${overdue > 0 ? "text-brick" : ""}`}>
              {overdue}
            </span>
          }
        />
        <StatCard
          label="Pipeline prospects"
          icon={<Users size={20} />}
          value={
            <span className="num text-brass">
              {formatMoney(pipeline.total, DEFAULT_CURRENCY)}
            </span>
          }
          hint={`${pipeline.count} prospects actifs`}
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
                  "text-ledger font-medium",
                )}
              >
                Voir tout
                <ArrowRight className="ml-1.5" size={16} />
              </Link>
            </div>
            <div className="rounded-xl border border-line bg-paper shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-line">
                    <TableHead className="w-[20%] text-ink/70 font-medium">Client</TableHead>
                    <TableHead className="text-ink/70 font-medium">Numéro</TableHead>
                    <TableHead className="text-right text-ink/70 font-medium">Montant</TableHead>
                    <TableHead className="text-ink/70 font-medium">Statut</TableHead>
                    <TableHead className="text-ink/70 font-medium">Échéance</TableHead>
                    <TableHead className="text-right text-ink/70 font-medium">Suivi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((invoice) => (
                    <TableRow key={invoice.id} className="border-line hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="font-medium text-ink hover:text-ledger transition-colors"
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

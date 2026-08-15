import Link from "next/link";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { InvoiceTrackingCell } from "@/components/invoice-tracking-cell";
import { EmptyDashboard } from "@/components/dashboard/empty-dashboard";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StatusDonutChart } from "@/components/dashboard/status-donut-chart";
import { TopClientsChart } from "@/components/dashboard/top-clients-chart";
import { StatCard } from "@/components/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  activeProspectsValue,
  CURRENT_USER,
  formatDateFr,
  formatEuro,
  INVOICES,
  monthRevenue,
  overdueInvoiceCount,
  pendingInvoiceCount,
} from "@/lib/mock-data";

/** Toggle to preview the empty state visually */
const SHOW_EMPTY_STATE = false;

export default function DashboardPage() {
  const pipeline = activeProspectsValue();
  const overdue = overdueInvoiceCount();
  const recent = [...INVOICES]
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
    .slice(0, 5);
  const monthLabel = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date("2026-08-15"));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-2xl font-semibold text-ink">
          Bonjour {CURRENT_USER.name.split(" ")[0]}
        </h1>
        <p className="mt-1 capitalize text-sm text-ink/60">{monthLabel}</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenu du mois"
          value={
            <span className="num text-brass">{formatEuro(monthRevenue())}</span>
          }
        />
        <StatCard
          label="Factures en attente"
          value={<span className="num">{pendingInvoiceCount()}</span>}
        />
        <StatCard
          label="Factures en retard"
          value={
            <span className={`num ${overdue > 0 ? "text-brick" : ""}`}>
              {overdue}
            </span>
          }
        />
        <StatCard
          label="Pipeline prospects"
          value={
            <span className="num text-brass">
              {formatEuro(pipeline.total)}
            </span>
          }
          hint={`${pipeline.count} prospects actifs`}
        />
      </section>

      {SHOW_EMPTY_STATE || INVOICES.length === 0 ? (
        <EmptyDashboard />
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RevenueChart />
            </div>
            <StatusDonutChart />
          </section>

          <TopClientsChart />

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-serif text-base font-semibold text-ink">
                Dernières factures
              </h2>
              <Link
                href="/invoices"
                className="text-sm font-medium text-ledger underline-offset-2 hover:underline"
              >
                Voir tout
              </Link>
            </div>
            <div className="rounded-sm border border-line bg-paper">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Client</TableHead>
                    <TableHead>Numéro</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead className="text-right">Suivi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((invoice) => (
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
                        {formatEuro(invoice.total)}
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

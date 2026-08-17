"use client";

import { StatCard } from "@/components/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/mock-data";
import type { CurrencyCode } from "@/lib/money";
import type { RevenuePoint } from "@/lib/dal/reports";

const salesConfig = {
  amount: { label: "CA", color: "var(--chart-1)" },
} satisfies ChartConfig;

const expenseConfig = {
  amount: { label: "Dépenses", color: "var(--chart-4)" },
} satisfies ChartConfig;

export type ReportsPageClientProps = {
  currency: CurrencyCode;
  collected: number;
  billedTtc: number;
  salesHt: number;
  expensesHt: number;
  expensesTtc: number;
  profit: number;
  paidInvoiceCount: number;
  pendingInvoiceCount: number;
  overdueInvoiceCount: number;
  revenueSeries: RevenuePoint[];
  expensesByCategory: { name: string; amount: number; fill: string }[];
  vatCollectedAmount: number;
  vatDeductible: number;
  vatBalance: number;
  vatRows: { rate: number; amount: number }[];
  paymentsByCurrency: { currency: CurrencyCode; amount: number }[];
};

export function ReportsPageClient(props: ReportsPageClientProps) {
  const {
    currency,
    collected,
    billedTtc,
    salesHt,
    expensesHt,
    expensesTtc,
    profit,
    paidInvoiceCount,
    pendingInvoiceCount,
    overdueInvoiceCount,
    revenueSeries,
    expensesByCategory,
    vatCollectedAmount,
    vatDeductible,
    vatBalance,
    vatRows,
    paymentsByCurrency,
  } = props;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-semibold text-ink">Rapports</h1>
        <p className="mt-1 text-sm text-ink/60">
          Analyses et synthèses comptables
        </p>
      </header>

      <Tabs defaultValue="sales">
        <TabsList variant="default" className="h-auto flex-wrap rounded-full bg-muted/80 p-1">
          <TabsTrigger value="sales" className="rounded-full">Ventes</TabsTrigger>
          <TabsTrigger value="pl" className="rounded-full">Pertes & Profits</TabsTrigger>
          <TabsTrigger value="expenses" className="rounded-full">Dépenses</TabsTrigger>
          <TabsTrigger value="vat" className="rounded-full">TVA</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-6 space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="CA encaissé"
              value={
                <span className="num text-brass">
                  {formatMoney(collected, currency)}
                </span>
              }
              hint="Somme des paiements enregistrés"
            />
            <StatCard
              label="CA facturé (TTC)"
              value={
                <span className="num">{formatMoney(billedTtc, currency)}</span>
              }
              hint="Factures + avoirs (signés)"
            />
            <StatCard
              label="Factures payées"
              value={<span className="num">{paidInvoiceCount}</span>}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard
              label="En attente"
              value={<span className="num">{pendingInvoiceCount}</span>}
            />
            <StatCard
              label="En retard"
              value={
                <span className="num text-brick">{overdueInvoiceCount}</span>
              }
            />
          </div>
          <div className="rounded-2xl border border-line bg-card p-4 sm:p-5">
            <h2 className="mb-4 font-serif text-base font-semibold text-ink">
              Évolution des encaissements
            </h2>
            <ChartContainer
              config={salesConfig}
              className="aspect-auto h-[260px] w-full"
            >
              <BarChart data={revenueSeries}>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--color-line)"
                  strokeDasharray="3 3"
                />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="border-line bg-paper"
                      formatter={(value) => (
                        <span className="num">
                          {formatMoney(Number(value), currency)}
                        </span>
                      )}
                    />
                  }
                />
                <Bar
                  dataKey="amount"
                  fill="var(--color-amount)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </TabsContent>

        <TabsContent value="pl" className="mt-6 space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Produits HT"
              value={
                <span className="num text-ledger">
                  {formatMoney(salesHt, currency)}
                </span>
              }
            />
            <StatCard
              label="Charges HT"
              value={
                <span className="num text-brick">
                  {formatMoney(expensesHt, currency)}
                </span>
              }
            />
            <StatCard
              label="Résultat"
              value={
                <span
                  className={`num ${profit >= 0 ? "text-ledger" : "text-brick"}`}
                >
                  {formatMoney(profit, currency)}
                </span>
              }
            />
          </div>
          <div className="rounded-2xl border border-line bg-card p-5">
            <h2 className="mb-4 font-serif text-base font-semibold text-ink">
              Compte de résultat simplifié (HT)
            </h2>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between border-b border-line pb-2">
                <span>Chiffre d’affaires HT</span>
                <span className="num font-medium">
                  {formatMoney(salesHt, currency)}
                </span>
              </li>
              <li className="flex justify-between border-b border-line pb-2">
                <span>Charges d’exploitation HT</span>
                <span className="num font-medium text-brick">
                  − {formatMoney(expensesHt, currency)}
                </span>
              </li>
              <li className="flex justify-between pt-2">
                <span className="font-medium">Résultat net</span>
                <span
                  className={`num text-lg font-semibold ${profit >= 0 ? "text-ledger" : "text-brick"}`}
                >
                  {formatMoney(profit, currency)}
                </span>
              </li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="mt-6 space-y-6">
          <StatCard
            label="Total des dépenses (TTC)"
            value={
              <span className="num text-brick">
                {formatMoney(expensesTtc, currency)}
              </span>
            }
            hint={
              paymentsByCurrency.length > 1
                ? paymentsByCurrency
                    .map((r) => formatMoney(r.amount, r.currency))
                    .join(" · ")
                : undefined
            }
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-card p-4">
              <h2 className="mb-4 font-serif text-base font-semibold text-ink">
                Répartition par catégorie
              </h2>
              <ChartContainer
                config={expenseConfig}
                className="mx-auto aspect-square h-[200px]"
              >
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    dataKey="amount"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                  >
                    {expensesByCategory.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="border-line bg-paper"
                        formatter={(value) => (
                          <span className="num">
                            {formatMoney(Number(value), currency)}
                          </span>
                        )}
                      />
                    }
                  />
                </PieChart>
              </ChartContainer>
            </div>
            <div className="rounded-2xl border border-line bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expensesByCategory.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell className="num text-right">
                        {formatMoney(row.amount, currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="vat" className="mt-6 space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="TVA collectée"
              value={
                <span className="num text-brass">
                  {formatMoney(vatCollectedAmount, currency)}
                </span>
              }
            />
            <StatCard
              label="TVA déductible"
              value={
                <span className="num">
                  {formatMoney(vatDeductible, currency)}
                </span>
              }
            />
            <StatCard
              label="Solde à déclarer"
              value={
                <span
                  className={`num ${vatBalance >= 0 ? "text-brick" : "text-ledger"}`}
                >
                  {formatMoney(vatBalance, currency)}
                </span>
              }
              hint={
                vatBalance >= 0
                  ? "À reverser à l’administration"
                  : "Crédit de TVA"
              }
            />
          </div>
          <div className="rounded-2xl border border-line bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Taux</TableHead>
                  <TableHead className="text-right">TVA collectée</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vatRows.map((row) => (
                  <TableRow key={row.rate}>
                    <TableCell className="num">{row.rate} %</TableCell>
                    <TableCell className="num text-right">
                      {formatMoney(row.amount, currency)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-medium">Total</TableCell>
                  <TableCell className="num text-right font-medium">
                    {formatMoney(
                      vatRows.reduce((s, r) => s + r.amount, 0),
                      currency,
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

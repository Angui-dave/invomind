"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  type TopClientRevenue,
} from "@/lib/mock-data";

const chartConfig = {
  amount: {
    label: "Revenu",
    color: "var(--color-ledger)",
  },
} satisfies ChartConfig;

type TopClientsChartProps = {
  clients: TopClientRevenue[];
};

export function TopClientsChart({ clients }: TopClientsChartProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const data = clients.map((client) => ({
    name: client.clientName.split(" ")[0],
    fullName: client.clientName,
    amount: client.amount,
  }));

  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-sm sm:p-6">
      <h2 className="mb-6 font-serif text-lg font-semibold text-ink">
        Top 5 clients par revenu
      </h2>

      {!loaded ? (
        <Skeleton className="h-[220px] w-full rounded-sm bg-line/50" />
      ) : (
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[220px] w-full"
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 8, right: 16, top: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillClients" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-ledger)" />
                <stop offset="100%" stopColor="var(--color-brass)" />
              </linearGradient>
            </defs>
            <CartesianGrid
              horizontal={false}
              stroke="var(--color-line)"
              strokeDasharray="3 3"
            />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              width={72}
              tick={{ fill: "var(--color-ink)", fontSize: 12, opacity: 0.7 }}
            />
            <XAxis type="number" hide />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="border-line bg-paper"
                  labelKey="fullName"
                  formatter={(value) => (
                    <span className="num font-medium text-ink">
                      {formatMoney(Number(value), DEFAULT_CURRENCY)}
                    </span>
                  )}
                />
              }
            />
            <Bar
              dataKey="amount"
              fill="url(#fillClients)"
              radius={[0, 6, 6, 0]}
              barSize={18}
            />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}

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
    color: "var(--chart-1)",
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
    <div className="rounded-xl border border-line bg-paper p-5 sm:p-6 shadow-sm">
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
              fill="var(--color-amount)"
              radius={[0, 3, 3, 0]}
              barSize={18}
            />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}

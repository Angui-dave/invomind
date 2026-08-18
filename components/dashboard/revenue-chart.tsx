"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  type RevenuePoint,
} from "@/lib/mock-data";

const chartConfig = {
  revenue: {
    label: "Revenu",
    color: "var(--color-ledger)",
  },
} satisfies ChartConfig;

type Period = "3" | "6" | "12";

type RevenueChartProps = {
  seriesByPeriod: Record<Period, RevenuePoint[]>;
};

export function RevenueChart({ seriesByPeriod }: RevenueChartProps) {
  const [period, setPeriod] = useState<Period>("6");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const data = useMemo(
    () =>
      (seriesByPeriod[period] ?? []).map((point) => ({
        label: point.label,
        revenue: point.amount,
      })),
    [period, seriesByPeriod],
  );

  const periodTotal = useMemo(
    () => data.reduce((sum, point) => sum + point.revenue, 0),
    [data],
  );

  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold text-ink">
            Évolution du revenu
          </h2>
          <p className="mt-0.5 text-xs text-ink/50">
            Total période ·{" "}
            <span className="num font-medium text-ink/70">
              {formatMoney(periodTotal, DEFAULT_CURRENCY)}
            </span>
          </p>
        </div>
        <Tabs
          value={period}
          onValueChange={(value) => setPeriod(value as Period)}
        >
          <TabsList variant="line" className="h-8">
            <TabsTrigger value="3" className="num text-xs">
              3M
            </TabsTrigger>
            <TabsTrigger value="6" className="num text-xs">
              6M
            </TabsTrigger>
            <TabsTrigger value="12" className="num text-xs">
              12M
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {!loaded ? (
        <Skeleton className="h-[220px] w-full rounded-sm bg-line/50" />
      ) : (
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[220px] w-full"
        >
          <AreaChart
            data={data}
            margin={{ left: 4, right: 4, top: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-ledger)"
                  stopOpacity={0.38}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-brass)"
                  stopOpacity={0.04}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--color-line)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: "var(--color-ink)", fontSize: 11, opacity: 0.55 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="border-line bg-paper"
                  formatter={(value) => (
                    <span className="num font-medium text-ink">
                      {formatMoney(Number(value), DEFAULT_CURRENCY)}
                    </span>
                  )}
                />
              }
            />
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#fillRevenue)"
              stroke="var(--color-ledger)"
              strokeWidth={2.25}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
}

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
import { DEFAULT_CURRENCY, formatMoney, revenueSeries } from "@/lib/mock-data";

const chartConfig = {
  revenue: {
    label: "Revenu",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type Period = "3" | "6" | "12";

export function RevenueChart() {
  const [period, setPeriod] = useState<Period>("6");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const data = useMemo(
    () =>
      revenueSeries(Number(period) as 3 | 6 | 12).map((point) => ({
        label: point.label,
        revenue: point.amount,
      })),
    [period],
  );

  return (
    <div className="rounded-xl border border-line bg-paper p-5 sm:p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-lg font-semibold text-ink">
          Évolution du revenu
        </h2>
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
        <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
          <AreaChart data={data} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="3 3" />
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
              stroke="var(--color-revenue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
}

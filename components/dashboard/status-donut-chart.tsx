"use client";

import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_LABELS } from "@/lib/mock-data";

const chartConfig = {
  paid: { label: STATUS_LABELS.paid, color: "var(--color-brass)" },
  partially_paid: {
    label: STATUS_LABELS.partially_paid,
    color: "var(--color-amber)",
  },
  sent: { label: STATUS_LABELS.sent, color: "var(--color-ledger)" },
  draft: { label: STATUS_LABELS.draft, color: "var(--chart-3)" },
  overdue: { label: STATUS_LABELS.overdue, color: "var(--color-brick)" },
} satisfies ChartConfig;

const ORDER = ["paid", "partially_paid", "sent", "draft", "overdue"] as const;

type StatusDonutChartProps = {
  counts: Record<string, number>;
};

export function StatusDonutChart({ counts }: StatusDonutChartProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const data = useMemo(
    () =>
      ORDER.map((status) => ({
        status,
        value: counts[status] ?? 0,
        fill: `var(--color-${status})`,
      })).filter((item) => item.value > 0),
    [counts],
  );

  const total = useMemo(
    () => ORDER.reduce((sum, status) => sum + (counts[status] ?? 0), 0),
    [counts],
  );

  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-sm sm:p-6">
      <h2 className="mb-6 font-serif text-lg font-semibold text-ink">
        Factures par statut
      </h2>

      {!loaded ? (
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="size-[160px] rounded-full bg-line/50" />
          <Skeleton className="h-16 w-full rounded-sm bg-line/40" />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative mx-auto">
            <ChartContainer
              config={chartConfig}
              className="aspect-square h-[160px] w-[160px]"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="border-line bg-paper"
                      hideLabel
                      nameKey="status"
                    />
                  }
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="status"
                  innerRadius={48}
                  outerRadius={72}
                  strokeWidth={2}
                  stroke="var(--color-paper)"
                >
                  {data.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="num text-xl font-semibold text-ink">{total}</span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-ink/45">
                factures
              </span>
            </div>
          </div>

          <ul className="w-full space-y-2 text-sm">
            {ORDER.map((status) => (
              <li
                key={status}
                className="flex items-center justify-between gap-3"
              >
                <span className="flex items-center gap-2 text-ink/75">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: chartConfig[status].color,
                    }}
                    aria-hidden
                  />
                  {STATUS_LABELS[status]}
                </span>
                <span className="num font-medium text-ink">
                  {counts[status] ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

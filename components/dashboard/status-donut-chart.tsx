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
  paid: { label: STATUS_LABELS.paid, color: "var(--chart-1)" },
  partially_paid: {
    label: STATUS_LABELS.partially_paid,
    color: "var(--chart-5, #B08D57)",
  },
  sent: { label: STATUS_LABELS.sent, color: "var(--chart-2)" },
  draft: { label: STATUS_LABELS.draft, color: "var(--chart-3)" },
  overdue: { label: STATUS_LABELS.overdue, color: "var(--chart-4)" },
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

  return (
    <div className="rounded-xl border border-line bg-paper p-5 sm:p-6 shadow-sm">
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
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-[160px] w-[160px]"
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

          <ul className="w-full space-y-2 text-sm">
            {ORDER.map((status) => (
              <li
                key={status}
                className="flex items-center justify-between gap-3"
              >
                <span className="flex items-center gap-2 text-ink/75">
                  <span
                    className="size-2.5 shrink-0 rounded-[2px]"
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

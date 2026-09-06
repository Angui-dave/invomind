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
import { STATUS_LABELS } from "@/lib/documents";

const chartConfig = {
  paid: { label: STATUS_LABELS.paid, color: "var(--color-brass)" },
  partially_paid: {
    label: STATUS_LABELS.partially_paid,
    color: "var(--color-amber)",
  },
  sent: { label: STATUS_LABELS.sent, color: "var(--color-ledger)" },
  unpaid: { label: STATUS_LABELS.unpaid, color: "var(--color-amber)" },
  draft: { label: STATUS_LABELS.draft, color: "var(--chart-3)" },
  overdue: { label: STATUS_LABELS.overdue, color: "var(--color-brick)" },
} satisfies ChartConfig;

const ORDER = ["paid", "partially_paid", "sent", "unpaid", "draft", "overdue"] as const;

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
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5">
      <h2 className="mb-4 shrink-0 font-serif text-base font-semibold text-ink sm:text-lg">
        Factures par statut
      </h2>

      {!loaded ? (
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="size-[140px] rounded-full bg-line/50" />
          <Skeleton className="h-16 w-full rounded-sm bg-line/40" />
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col items-center gap-4 xl:flex-row xl:items-center">
          <div className="relative mx-auto shrink-0">
            <ChartContainer
              config={chartConfig}
              className="aspect-square !h-[140px] !w-[140px] overflow-hidden"
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
                  innerRadius={42}
                  outerRadius={62}
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
              <span className="num text-lg font-semibold text-ink">{total}</span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-ink/45">
                factures
              </span>
            </div>
          </div>

          <ul className="w-full min-w-0 flex-1 space-y-1.5 text-sm">
            {ORDER.map((status) => (
              <li
                key={status}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2"
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: chartConfig[status].color,
                  }}
                  aria-hidden
                />
                <span className="truncate text-ink/75" title={STATUS_LABELS[status]}>
                  {STATUS_LABELS[status]}
                </span>
                <span className="num shrink-0 tabular-nums font-medium text-ink">
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

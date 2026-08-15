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
import {
  invoiceStatusCounts,
  STATUS_LABELS,
  type InvoiceStatus,
} from "@/lib/mock-data";

const chartConfig = {
  paid: { label: STATUS_LABELS.paid, color: "var(--chart-1)" },
  sent: { label: STATUS_LABELS.sent, color: "var(--chart-2)" },
  draft: { label: STATUS_LABELS.draft, color: "var(--chart-3)" },
  overdue: { label: STATUS_LABELS.overdue, color: "var(--chart-4)" },
} satisfies ChartConfig;

const ORDER: InvoiceStatus[] = ["paid", "sent", "draft", "overdue"];

export function StatusDonutChart() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const counts = useMemo(() => invoiceStatusCounts(), []);
  const data = ORDER.map((status) => ({
    status,
    value: counts[status],
    fill: `var(--color-${status})`,
  })).filter((item) => item.value > 0);

  return (
    <div className="rounded-sm border border-line bg-paper p-4 sm:p-5">
      <h2 className="mb-4 font-serif text-base font-semibold text-ink">
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
                    style={{ backgroundColor: `var(--chart-${ORDER.indexOf(status) + 1})` }}
                    aria-hidden
                  />
                  {STATUS_LABELS[status]}
                </span>
                <span className="num font-medium text-ink">
                  {counts[status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

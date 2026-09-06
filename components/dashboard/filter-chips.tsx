import Link from "next/link";
import { cn } from "@/lib/utils";
import type { FilterChipOption } from "@/lib/dashboard/status-filters";

type FilterChipsProps = {
  options: FilterChipOption[];
  value: string;
  hrefFor: (value: string) => string;
  ariaLabel?: string;
};

export function FilterChips({
  options,
  value,
  hrefFor,
  ariaLabel = "Filtrer par statut",
}: FilterChipsProps) {
  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap gap-1.5">
      {options.map((chip) => {
        const active = chip.value === value;
        return (
          <Link
            key={chip.value}
            href={hrefFor(chip.value)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-ledger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ledger/40",
              active
                ? "border-ledger bg-ledger text-paper"
                : "border-line bg-paper text-ink/70 hover:border-ledger/40 hover:text-ink",
            )}
          >
            {chip.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function statusFilterHref(basePath: string, value: string): string {
  return value === "all" ? basePath : `${basePath}?status=${value}`;
}

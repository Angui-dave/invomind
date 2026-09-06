import Link from "next/link";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string;
  className?: string;
  markClassName?: string;
};

export function BrandLogo({
  href = "/",
  className,
  markClassName,
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 font-serif text-lg font-semibold tracking-tight text-ink transition-ledger hover:text-ledger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-xl bg-ledger text-paper",
          markClassName,
        )}
        aria-hidden
      >
        <BookOpen className="size-4" strokeWidth={2.2} />
      </span>
      <span>InvoMind</span>
    </Link>
  );
}

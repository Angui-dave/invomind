import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionShellProps = {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  alt?: boolean;
  className?: string;
  contentClassName?: string;
};

export function SectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
  alt = false,
  className,
  contentClassName,
}: SectionShellProps) {
  const hasHeader = Boolean(eyebrow || title || description);

  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 border-b border-line/70",
        alt && "bg-gradient-to-b from-slate-50 to-paper",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        {hasHeader && (
          <header className="max-w-2xl">
            {eyebrow && (
              <p className="inline-flex items-center rounded-full border border-ledger/15 bg-ledger/8 px-3 py-1 text-xs font-medium uppercase tracking-wider text-ledger">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2
                className={cn(
                  "font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl",
                  eyebrow && "mt-3",
                )}
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-3 max-w-xl text-base leading-relaxed text-ink/65">
                {description}
              </p>
            )}
          </header>
        )}
        <div className={cn(hasHeader && "mt-10", contentClassName)}>
          {children}
        </div>
      </div>
    </section>
  );
}

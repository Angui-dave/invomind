import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionShellProps = {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  alt?: boolean;
  wide?: boolean;
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
  wide = false,
  className,
  contentClassName,
}: SectionShellProps) {
  const hasHeader = Boolean(eyebrow || title || description);

  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20 border-b border-line/70",
        alt && "bg-muted/40",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        {hasHeader && (
          <header className={cn(!wide && "max-w-2xl")}>
            {eyebrow && (
              <p className="folio-mark folio-mark-accent">{eyebrow}</p>
            )}
            {title && (
              <h2
                className={cn(
                  "font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl",
                  eyebrow && "mt-2",
                )}
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                className={cn(
                  "mt-3 text-base leading-relaxed text-ink/70",
                  !wide && "max-w-xl",
                )}
              >
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

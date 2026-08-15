import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="mb-8 font-serif text-2xl font-semibold tracking-tight text-ink transition-ledger hover:text-ledger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        InvoMind
      </Link>
      <div className="w-full max-w-sm rounded-sm border border-line bg-paper p-6 shadow-[0_4px_14px_-2px_rgba(22,33,62,0.08)]">
        {children}
      </div>
    </div>
  );
}

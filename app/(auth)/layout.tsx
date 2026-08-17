import type { ReactNode } from "react";
import { BrandLogo } from "@/components/marketing/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";

const PAYMENT_PARTNERS = [
  "Wave",
  "Orange Money",
  "MTN",
  "Moov",
  "Stripe",
] as const;

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-full flex-1 lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-navy text-navy-fg lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgb(16_185_129/0.22),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgb(37_99_235/0.28),transparent_55%)]"
        />
        <BrandLogo
          className="relative text-navy-fg hover:text-brass"
          markClassName="bg-brass text-navy"
        />
        <div className="relative max-w-md">
          <p className="inline-flex rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-medium text-navy-fg/80">
            SaaS FinTech
          </p>
          <h1 className="mt-5 font-serif text-3xl font-semibold leading-tight">
            Facturez en 1 minute.
            <br />
            Encaissez par Mobile Money.
          </h1>
          <blockquote className="mt-8 border-l-2 border-brass/70 pl-4 text-sm leading-relaxed text-navy-fg/75">
            « Mes clients paient par Wave depuis le lien. Plus de relances à la
            main. »
            <footer className="mt-2 text-xs text-navy-fg/50">
              Aminata Diallo · Studio, Dakar
            </footer>
          </blockquote>
        </div>
        <ul className="relative flex flex-wrap gap-2">
          {PAYMENT_PARTNERS.map((name) => (
            <li
              key={name}
              className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-xs text-navy-fg/70"
            >
              {name}
            </li>
          ))}
        </ul>
      </aside>

      <div className="relative flex flex-col items-center justify-center bg-paper px-4 py-12">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="mb-8 lg:hidden">
          <BrandLogo />
        </div>
        <div className="w-full max-w-sm rounded-3xl border border-line bg-card p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/marketing/brand-logo";
import { MARKETING_FOOTER_LINKS, MARKETING_NAV } from "@/components/marketing/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-40">
      <div className="bg-navy text-navy-fg">
        <p className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-xs sm:text-sm">
          <Sparkles className="hidden size-3.5 shrink-0 text-brass sm:block" aria-hidden />
          <span>
            <span className="font-medium text-brass">Nouveau</span>
            {" — "}
            Encaissement direct Wave &amp; Orange Money, sans frais cachés
          </span>
        </p>
      </div>
      <header className="border-b border-line/70 bg-paper/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <BrandLogo />
          <nav className="hidden items-center gap-1 lg:flex">
            {MARKETING_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-ink/70 transition-ledger hover:bg-muted hover:text-ink"
              >
                {item.label}
                {"badge" in item && item.badge && (
                  <span className="rounded-full bg-ledger/12 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ledger">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:inline-flex" />
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden h-9 rounded-full px-3 sm:inline-flex",
              )}
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "sm" }),
                "glow-cta h-9 rounded-full bg-ledger px-4 text-paper hover:bg-ledger/90",
              )}
            >
              Créer un compte
            </Link>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full border-line lg:hidden"
              aria-label="Ouvrir le menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-4" />
            </Button>
          </div>
        </div>
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[280px] bg-paper p-0">
          <SheetHeader className="border-b border-line px-4 py-4">
            <SheetTitle className="font-serif text-ink">Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-3">
            {MARKETING_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 text-sm text-ink/80 transition-ledger hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2 text-sm text-ink/80 transition-ledger hover:bg-muted sm:hidden"
            >
              Se connecter
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

const FOOTER_COLUMNS = [
  {
    title: "Produit",
    links: [
      { href: "/#produit", label: "Produit" },
      { href: "/#fonctionnalites", label: "Fonctionnalités" },
      { href: "/#tarifs", label: "Tarifs" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Outils",
    links: [
      { href: "/outils/calculateur-tva", label: "Calculateur TVA" },
      { href: "/outils/generateur-qr-facture", label: "Générateur QR" },
    ],
  },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <BrandLogo className="text-base" markClassName="size-7" />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink/60">
            Facturation, encaissement Mobile Money et relances automatiques
            pour les freelances et PME en Afrique, France et Suisse.
          </p>
        </div>
        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="text-xs font-medium uppercase tracking-wider text-ink/45">
              {column.title}
            </p>
            <nav className="mt-3 flex flex-col gap-2 text-sm text-ink/70">
              {column.links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition-ledger hover:text-ledger"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-ink/55">
            © {new Date().getFullYear()} InvoMind. Tous droits réservés.
          </p>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/55">
            {MARKETING_FOOTER_LINKS.slice(0, 3).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-ledger hover:text-ledger"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

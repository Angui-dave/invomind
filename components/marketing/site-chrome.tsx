import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-serif text-lg font-semibold tracking-tight text-ink transition-ledger hover:text-ledger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          InvoMind
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "sm" }),
              "bg-ledger text-paper hover:bg-ledger/90",
            )}
          >
            Créer mon compte
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="font-serif text-sm font-medium text-ink">InvoMind</p>
        <nav className="flex flex-wrap gap-4 text-sm text-ink/60">
          <Link
            href="/outils/calculateur-tva"
            className="hover:text-ledger transition-ledger"
          >
            Calculateur TVA
          </Link>
          <Link
            href="/outils/generateur-qr-facture"
            className="hover:text-ledger transition-ledger"
          >
            Générateur QR
          </Link>
        </nav>
        <p className="text-sm text-ink/60">
          Facturation pour l’Afrique et le monde. © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}

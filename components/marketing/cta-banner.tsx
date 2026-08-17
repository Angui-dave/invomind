import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-ink text-paper">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-0 size-72 rounded-full bg-brass/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-0 size-80 rounded-full bg-ledger/30 blur-3xl"
      />
      <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 py-16 sm:flex-row sm:items-center sm:px-6 sm:py-20">
        <div className="max-w-xl">
          <p className="inline-flex items-center rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-medium text-paper/80">
            Compte gratuit · sans carte bancaire
          </p>
          <h2 className="mt-4 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
            Commence à t’encaisser à temps dès aujourd’hui.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-paper/65">
            3 factures par mois, portail client et QR Mobile Money inclus.
            Passe en Pro quand le volume l’exige.
          </p>
        </div>
        <Link
          href="/register"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-12 shrink-0 rounded-full bg-brass px-6 text-sm font-semibold text-ink hover:bg-brass/90",
          )}
        >
          Créer mon compte gratuitement
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

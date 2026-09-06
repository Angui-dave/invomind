import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { FREE_PLAN_SENTENCE } from "@/lib/marketing/copy";
import { cn } from "@/lib/utils";

export function CtaBanner() {
  return (
    <section className="stub-strip stub-strip-bottom relative overflow-hidden bg-navy text-navy-fg">
      <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 py-16 sm:flex-row sm:items-center sm:px-6 sm:py-20">
        <div className="max-w-xl">
          <p className="folio-mark text-navy-fg/55">
            Compte gratuit · sans carte bancaire
          </p>
          <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
            Encaissez à temps dès aujourd’hui.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-navy-fg/70">
            {FREE_PLAN_SENTENCE} Portail client inclus. Passez en Pro quand le
            volume l’exige.
          </p>
        </div>
        <Link
          href="/register"
          className={cn(
            buttonVariants({ size: "lg" }),
            "glow-cta h-12 shrink-0 rounded-full bg-ledger px-6 text-sm font-semibold text-paper hover:bg-ledger/90",
          )}
        >
          Créer mon compte gratuitement
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

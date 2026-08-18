import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyDashboard() {
  return (
    <div className="dashboard-hero-bg flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-paper/80 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full border border-ledger/20 bg-ledger/10">
        <FilePlus2 className="size-6 text-ledger" aria-hidden />
      </div>
      <h2 className="mt-4 font-serif text-xl font-semibold text-ink">
        Créez votre première facture
      </h2>
      <p className="mt-2 max-w-sm text-sm text-ink/65">
        Aucune facture pour l’instant. Ajoutez un client, générez une facture et
        suivez le paiement depuis ce tableau de bord.
      </p>
      <Link
        href="/invoices/new"
        className={cn(
          buttonVariants({ size: "lg" }),
          "glow-cta mt-6 h-10 rounded-full bg-ledger px-5 text-paper hover:bg-ledger/90",
        )}
      >
        Créer ma première facture
      </Link>
    </div>
  );
}

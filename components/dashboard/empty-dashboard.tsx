import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageEmptyState } from "@/components/dashboard/page-empty-state";
import { cn } from "@/lib/utils";

export function EmptyDashboard() {
  return (
    <PageEmptyState
      icon={FilePlus2}
      title="Créez votre première facture"
      description="Aucune facture pour l’instant. Ajoutez un client, générez une facture et suivez le paiement depuis ce tableau de bord."
      action={
        <Link
          href="/invoices/new"
          className={cn(
            buttonVariants({ size: "lg" }),
            "glow-cta h-10 rounded-full bg-ledger px-5 text-paper hover:bg-ledger/90",
          )}
        >
          Créer ma première facture
        </Link>
      }
    />
  );
}

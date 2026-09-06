import Link from "next/link";
import { ArrowRight, Calculator, Globe2, QrCode } from "lucide-react";
import { SectionShell } from "@/components/marketing/section-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TOOLS = [
  {
    href: "/outils/calculateur-tva",
    icon: Calculator,
    title: "Calculateur de TVA",
    body: "HT, TVA et TTC selon les régimes Sénégal, Côte d’Ivoire, France, Suisse et Maroc.",
    cta: "Ouvrir le calculateur",
  },
  {
    href: "/outils/generateur-qr-facture",
    icon: QrCode,
    title: "Générateur QR facture",
    body: "QR EMV scannable pour Wave, Orange Money, MTN, Moov et TWINT — sans compte.",
    cta: "Générer un QR",
  },
  {
    href: "/register",
    icon: Globe2,
    title: "Devises dans InvoMind",
    body: "XOF, XAF, EUR, USD, CHF et MAD sur vos devis et factures, une fois le compte créé.",
    cta: "Créer mon compte",
  },
] as const;

export function FreeToolsBanner() {
  return (
    <SectionShell
      id="outils"
      eyebrow="Outils"
      title="Essayez avant de vous inscrire"
      description="Calculateur de TVA et générateur QR en pages dédiées. Aucun compte requis."
    >
      <ul className="divide-y divide-line/80 border border-line/80 bg-paper">
        {TOOLS.map((tool) => (
          <li
            key={tool.href + tool.title}
            className="grid gap-4 px-5 py-5 sm:grid-cols-[2.5rem_1fr_auto] sm:items-center sm:gap-5 sm:px-6"
          >
            <span className="flex size-9 items-center justify-center border border-line/80 text-ledger">
              <tool.icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="font-serif text-lg font-semibold text-ink">
                {tool.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                {tool.body}
              </p>
            </div>
            <Link
              href={tool.href}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-fit rounded-full border-line text-xs font-semibold",
              )}
            >
              {tool.cta}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

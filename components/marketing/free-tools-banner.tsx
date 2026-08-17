import Link from "next/link";
import { Calculator, QrCode } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SectionShell } from "@/components/marketing/section-shell";
import { cn } from "@/lib/utils";

const TOOLS = [
  {
    href: "/outils/calculateur-tva",
    icon: Calculator,
    title: "Calculateur de TVA",
    description:
      "HT, TVA et TTC selon le régime SN, CI, FR, CH, MA… Sans créer de compte.",
  },
  {
    href: "/outils/generateur-qr-facture",
    icon: QrCode,
    title: "Générateur QR facture",
    description:
      "QR EMV pour Wave, Orange Money, MTN, Moov, M-Pesa ou TWINT, à télécharger en PNG.",
  },
] as const;

export function FreeToolsBanner() {
  return (
    <SectionShell
      id="outils"
      eyebrow="Outils gratuits"
      title="Utilisez InvoMind avant même de vous inscrire"
      description="Deux mini-outils pour facturer et encaisser dès aujourd’hui — et découvrir le registre ensuite."
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="flex h-full flex-col rounded-3xl border border-line/80 bg-paper p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-ledger/5"
            >
              <tool.icon className="size-5 text-ledger" aria-hidden />
              <h3 className="mt-3 font-serif text-lg font-semibold text-ink">
                {tool.title}
              </h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink/65">
                {tool.description}
              </p>
              <span
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "mt-4 h-8 w-fit rounded-full border-line",
                )}
              >
                Ouvrir l’outil
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

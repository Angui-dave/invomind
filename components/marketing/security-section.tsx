import { FileCheck, Lock, ShieldCheck, UserCheck } from "lucide-react";
import { SectionShell } from "@/components/marketing/section-shell";

const PILLARS = [
  {
    icon: Lock,
    title: "Vos données sont protégées",
    body: "Chiffrement en transit et au repos. Personne ne peut les intercepter ni les lire en chemin.",
  },
  {
    icon: ShieldCheck,
    title: "Paiements chez des agrégateurs",
    body: "Les encaissements passent par des processeurs agréés. InvoMind orchestre le lien, jamais vos fonds.",
  },
  {
    icon: UserCheck,
    title: "Ce que vous partagez reste privé",
    body: "Factures, clients et soldes ne servent qu’à votre organisation. Aucune revente à des annonceurs.",
  },
  {
    icon: FileCheck,
    title: "Conformité fiscale native",
    body: "TVA préconfigurée pour l’UEMOA, la France et la Suisse. Numérotation, mentions légales et rapports prêts à déclarer.",
  },
] as const;

export function SecuritySection() {
  return (
    <SectionShell
      eyebrow="Sécurité et confiance"
      title="Vos données, au même niveau d’exigence que vos factures"
      description="Protection, agrégation responsable, et isolation multi-tenant par organisation."
    >
      <ul className="divide-y divide-line/80 border border-line/80 bg-paper">
        {PILLARS.map((item) => (
          <li
            key={item.title}
            className="grid gap-4 px-5 py-5 sm:grid-cols-[2.5rem_1fr] sm:gap-5 sm:px-6"
          >
            <span className="flex size-9 shrink-0 items-center justify-center border border-line/80 text-ledger">
              <item.icon className="size-4" aria-hidden />
            </span>
            <div>
              <h3 className="font-serif text-lg font-semibold text-ink">
                {item.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-ink/70">
                {item.body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

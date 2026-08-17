import { FileCheck, Lock, ShieldCheck, UserCheck } from "lucide-react";
import { SectionShell } from "@/components/marketing/section-shell";

const PILLARS = [
  {
    icon: Lock,
    title: "Tes données sont protégées",
    body: "Tout ce que tu nous envoies est chiffré en transit et au repos. Personne ne peut l’intercepter ni le lire en chemin.",
  },
  {
    icon: ShieldCheck,
    title: "Paiements gérés par des agrégateurs",
    body: "Les encaissements passent par des processeurs agréés. InvoMind orchestre le lien, jamais tes fonds.",
  },
  {
    icon: UserCheck,
    title: "Ce que tu partages reste privé",
    body: "Tes factures, clients et soldes servent uniquement à toi. On ne revend jamais tes informations à des annonceurs.",
  },
  {
    icon: FileCheck,
    title: "Conformité fiscale native",
    body: "TVA préconfigurée pour la zone UEMOA, la France et la Suisse. Numérotation, mentions légales et rapports prêts à déclarer.",
  },
] as const;

export function SecuritySection() {
  return (
    <SectionShell
      eyebrow="Sécurité & confiance"
      title="Tes données et ta sérénité, au cœur de notre exigence"
      description="Transparence sur nos pratiques : protection, agrégation responsable et partenaires techniques alignés sur le même niveau d’exigence."
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {PILLARS.map((item) => (
          <li
            key={item.title}
            className="rounded-3xl border border-line/80 bg-paper p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-ledger/5"
          >
            <span className="flex size-10 items-center justify-center rounded-2xl bg-ledger/10 text-ledger">
              <item.icon className="size-5" aria-hidden />
            </span>
            <h3 className="mt-4 font-serif text-lg font-semibold text-ink">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/65">
              {item.body}
            </p>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

import { SectionShell } from "@/components/marketing/section-shell";

const STORIES = [
  {
    quote:
      "Les clients paient par Wave depuis le lien. Plus de relances WhatsApp à la main, et la facture passe à payée toute seule.",
    name: "Studio graphique",
    role: "Dakar",
  },
  {
    quote:
      "Un registre propre : devis, factures, TVA Sénégal et relances J+7. La trésorerie se lit enfin au même endroit.",
    name: "Agence digitale",
    role: "Abidjan",
  },
  {
    quote:
      "Le portail sans compte, c’est ce qu’il fallait. Les clients suisses scannent le QR, les autres paient par carte.",
    name: "Consultante",
    role: "Genève",
  },
  {
    quote:
      "Avant : Excel et trois applis. Maintenant devis, factures, dépenses et TVA sont au même endroit.",
    name: "Freelance",
    role: "Bamako",
  },
] as const;

export function TestimonialsSection() {
  return (
    <SectionShell
      alt
      eyebrow="Usages types"
      title="Pensé pour qui facture en Afrique de l’Ouest, en France et en Suisse"
      description="Scénarios représentatifs — pas des avis notés. Le produit vise ces usages, pas une communauté inventée."
    >
      <ul className="divide-y divide-line/80 border border-line/80 bg-paper">
        {STORIES.map((item) => (
          <li
            key={`${item.role}-${item.name}`}
            className="grid gap-3 px-5 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6 sm:px-6"
          >
            <div>
              <p className="text-sm font-semibold text-ink">{item.name}</p>
              <p className="num mt-0.5 text-xs text-ink/55">{item.role}</p>
            </div>
            <p className="text-sm leading-relaxed text-ink/75">{item.quote}</p>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

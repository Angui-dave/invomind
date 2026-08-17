import { Star } from "lucide-react";
import { SectionShell } from "@/components/marketing/section-shell";

const PARTNERS = [
  "Wave",
  "Orange Money",
  "MTN MoMo",
  "Moov",
  "Stripe",
  "Swiss QR",
] as const;

const TESTIMONIALS = [
  {
    quote:
      "Mes clients paient par Wave depuis le lien. Plus de relances WhatsApp à la main, et la facture passe à payée toute seule.",
    name: "Aminata Diallo",
    role: "Studio graphique, Dakar",
    initials: "AD",
  },
  {
    quote:
      "On a enfin un registre propre : devis, factures, TVA Sénégal et relances J+7. Ça a changé notre trésorerie en deux mois.",
    name: "Kofi Mensah",
    role: "Agence digitale, Abidjan",
    initials: "KM",
  },
  {
    quote:
      "Le portail sans compte, c’est exactement ce qu’il fallait. Mes clients suisses scannent le QR-bill, les autres paient par carte.",
    name: "Léa Moreau",
    role: "Consultante, Genève",
    initials: "LM",
  },
  {
    quote:
      "Avant, je jonglais entre Excel et trois applis. Maintenant tout est au même endroit, y compris les dépenses et la TVA.",
    name: "Yacine Traoré",
    role: "Freelance, Bamako",
    initials: "YT",
  },
] as const;

export function TestimonialsSection() {
  return (
    <>
      <SectionShell
        eyebrow="Partenaires"
        title="Ils nous font confiance"
        description="Des acteurs du paiement alignés sur le même niveau d’exigence, pour encaisser partout où tes clients sont."
      >
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {PARTNERS.map((partner) => (
            <li
              key={partner}
              className="flex h-16 items-center justify-center rounded-2xl border border-line/80 bg-paper text-sm font-semibold tracking-tight text-ink/70 shadow-sm"
            >
              {partner}
            </li>
          ))}
        </ul>
      </SectionShell>

      <SectionShell
        alt
        eyebrow="Communauté"
        title="Déjà plus de 10 000 indépendants et PME"
        description="Extraits d’avis et de retours d’expérience sur le registre, le portail et les encaissements."
      >
        <ul className="grid gap-4 sm:grid-cols-2">
          {TESTIMONIALS.map((item) => (
            <li
              key={item.name}
              className="flex h-full flex-col rounded-3xl border border-line/80 bg-paper p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-ledger/5"
            >
              <div className="flex gap-0.5 text-brass" aria-label="5 étoiles">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className="size-3.5 fill-current"
                    aria-hidden
                  />
                ))}
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/75">
                « {item.quote} »
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-ledger to-brass text-xs font-semibold text-paper">
                  {item.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{item.name}</p>
                  <p className="text-xs text-ink/55">{item.role}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </SectionShell>
    </>
  );
}

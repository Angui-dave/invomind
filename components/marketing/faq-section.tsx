import { SectionShell } from "@/components/marketing/section-shell";
import { FREE_LIMIT_LABEL, FREE_PLAN, PRO_PLAN } from "@/lib/marketing/copy";

const FAQS = [
  {
    q: "Mes clients doivent-ils créer un compte ?",
    a: "Non. Chaque facture a un lien de portail unique. Le client consulte le document, scanne le QR ou clique sur « Payer maintenant » — sans inscription.",
  },
  {
    q: "Quels pays et devises sont pris en charge ?",
    a: "Le moteur de TVA est préconfiguré pour le Sénégal, la Côte d’Ivoire et la zone UEMOA/CEMAC, la France, la Suisse et le Maroc. Devises natives : XOF, XAF, EUR, CHF, USD, MAD.",
  },
  {
    q: "Comment fonctionne le paiement Mobile Money ?",
    a: "Sur le portail, le client peut payer par carte ou Mobile Money (Wave, Orange Money, MTN MoMo, Moov). Un QR EMV est généré ; en Suisse, c’est un QR-bill. Le paiement en ligne est inclus à partir du plan Pro.",
  },
  {
    q: "Que comprend le plan Gratuit ?",
    a: `${FREE_PLAN.features.join(", ")}. ${FREE_LIMIT_LABEL}. Les relances automatiques, le paiement en ligne et l’import CSV sont dans le plan ${PRO_PLAN.name}.`,
  },
  {
    q: "Les relances partent-elles toutes seules ?",
    a: "Sur les plans Pro et Business, les jalons J-3, J+3, J+7 et J+14 s’appliquent par défaut. Vous pouvez les désactiver facture par facture, et personnaliser les modèles. Le plan Gratuit reste en relances manuelles.",
  },
  {
    q: "Mes données sont-elles isolées ?",
    a: "Oui. InvoMind est multi-tenant : chaque organisation a son registre. L’accès public au portail se fait uniquement via un jeton, pas via un identifiant interne.",
  },
] as const;

export function FaqSection() {
  return (
    <SectionShell
      id="faq"
      alt
      eyebrow="FAQ"
      title="Questions fréquentes"
      description="Les objections les plus courantes — et ce que le produit fait vraiment."
    >
      <div className="divide-y divide-line/80 border border-line/80 bg-paper">
        {FAQS.map((item) => (
          <details key={item.q} className="group px-5 open:bg-muted/30">
            <summary className="cursor-pointer list-none py-4 font-serif text-base font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-4">
                {item.q}
                <span
                  className="num mt-0.5 flex size-6 shrink-0 items-center justify-center border border-line/80 text-sm text-ledger group-open:hidden"
                  aria-hidden
                >
                  +
                </span>
                <span
                  className="num mt-0.5 hidden size-6 shrink-0 items-center justify-center border border-line/80 text-sm text-ledger group-open:flex"
                  aria-hidden
                >
                  −
                </span>
              </span>
            </summary>
            <p className="pb-4 text-sm leading-relaxed text-ink/70">{item.a}</p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
}

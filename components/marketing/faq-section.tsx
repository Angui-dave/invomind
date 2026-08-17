import { SectionShell } from "@/components/marketing/section-shell";

const FAQS = [
  {
    q: "Mes clients doivent-ils créer un compte ?",
    a: "Non. Chaque facture a un lien de portail unique. Le client consulte le document, scanne le QR ou clique sur « Payer maintenant » — sans inscription.",
  },
  {
    q: "Quels pays et devises sont pris en charge ?",
    a: "Le moteur de TVA est préconfiguré pour le Sénégal, la Côte d’Ivoire et la zone UEMOA/CEMAC, la France, la Suisse et le Maroc. Les devises natives incluent XOF, XAF, EUR, CHF, USD, MAD, et d’autres.",
  },
  {
    q: "Comment fonctionne le paiement Mobile Money ?",
    a: "Sur le portail, le client peut payer par carte ou Mobile Money (Wave, Orange Money, MTN MoMo, Moov, M-Pesa). Un QR EMV est généré ; en Suisse, c’est un QR-bill.",
  },
  {
    q: "Que comprend le plan Gratuit ?",
    a: "3 factures par mois, 5 clients, le portail, les relances manuelles, les dépenses et les rapports TVA. Les relances automatiques, le paiement en ligne, le pipeline et l’inbox sont en Pro.",
  },
  {
    q: "Les relances partent-elles toutes seules ?",
    a: "Sur le plan Pro et Business, les jalons J-3, J+3, J+7 et J+14 s’appliquent par défaut. Vous pouvez les désactiver facture par facture, et personnaliser les modèles.",
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
      description="Les objections que l’on entend le plus — et ce que le produit fait vraiment."
    >
      <div className="space-y-3">
        {FAQS.map((item) => (
          <details
            key={item.q}
            className="group rounded-2xl border border-line/80 bg-paper px-5 py-1 shadow-sm open:shadow-md"
          >
            <summary className="cursor-pointer list-none py-4 font-serif text-base font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-4">
                {item.q}
                <span
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-ledger/10 text-sm text-ledger group-open:hidden"
                  aria-hidden
                >
                  +
                </span>
                <span
                  className="mt-0.5 hidden size-6 shrink-0 items-center justify-center rounded-full bg-ledger/10 text-sm text-ledger group-open:flex"
                  aria-hidden
                >
                  −
                </span>
              </span>
            </summary>
            <p className="pb-4 text-sm leading-relaxed text-ink/65">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
}

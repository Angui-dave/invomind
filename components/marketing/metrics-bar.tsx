const METRICS = [
  {
    value: "0",
    label: "compte client requis",
    hint: "Le payeur ouvre le lien, et paie",
  },
  {
    value: "4",
    label: "réseaux Mobile Money",
    hint: "Wave, Orange Money, MTN, Moov",
  },
  {
    value: "3 min",
    label: "pour émettre la première facture",
    hint: "Compte gratuit, sans carte",
  },
  {
    value: "TVA",
    label: "préconfigurée selon le pays",
    hint: "UEMOA, France, Suisse, Maroc",
  },
] as const;

const PROVIDERS = [
  "Wave",
  "Orange Money",
  "MTN MoMo",
  "Moov",
  "Carte bancaire",
  "QR suisse",
] as const;

export function MetricsBar() {
  return (
    <section className="stub-strip stub-strip-bottom relative overflow-hidden bg-navy text-navy-fg">
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-14">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {METRICS.map((metric) => (
            <div key={metric.label} className="border-l border-white/15 pl-4">
              <p className="folio-mark text-navy-fg/50">Fait produit</p>
              <p className="num mt-2 text-3xl font-semibold tracking-tight text-navy-fg sm:text-4xl">
                {metric.value}
              </p>
              <p className="mt-2 text-sm font-medium text-navy-fg">
                {metric.label}
              </p>
              <p className="mt-0.5 text-xs text-navy-fg/65">{metric.hint}</p>
            </div>
          ))}
        </div>

        <ul className="mt-10 flex flex-wrap gap-2 border-t border-white/10 pt-8">
          {PROVIDERS.map((provider) => (
            <li
              key={provider}
              className="border border-white/15 px-3 py-1.5 text-navy-fg/80"
            >
              <span className="num text-[11px] uppercase tracking-wider">
                {provider}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

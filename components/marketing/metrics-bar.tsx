const METRICS = [
  {
    value: "98%",
    label: "des factures relancées à temps",
    hint: "Jalons J-3, J+3, J+7, J+14",
  },
  {
    value: "100%",
    label: "compatible Mobile Money",
    hint: "Wave, Orange Money, MTN, Moov",
  },
  {
    value: "3 min",
    label: "pour émettre la première facture",
    hint: "Compte gratuit, sans carte",
  },
  {
    value: "0",
    label: "compte client requis",
    hint: "Le payeur ouvre le lien, et paie",
  },
] as const;

export function MetricsBar() {
  return (
    <section className="relative overflow-hidden bg-ink text-paper">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(16_185_129/0.18),transparent_55%)]"
      />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:py-14">
        {METRICS.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-white/8 bg-white/4 p-4 backdrop-blur-sm"
          >
            <p className="num text-3xl font-semibold tracking-tight text-brass sm:text-4xl">
              {metric.value}
            </p>
            <p className="mt-2 text-sm font-medium text-paper">
              {metric.label}
            </p>
            <p className="mt-0.5 text-xs text-paper/55">{metric.hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

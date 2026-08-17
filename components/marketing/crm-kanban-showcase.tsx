import { formatMoney, PIPELINE_STAGES } from "@/lib/mock-data";

const STAGE_CARDS: Record<string, { name: string; company: string; value: number }[]> = {
  nouveau: [{ name: "Marie Dupont", company: "Boulangerie Dupont", value: 400_000 }],
  qualifie: [{ name: "Karim Benali", company: "Benali Tech", value: 1_800_000 }],
  devis: [{ name: "Élodie Martin", company: "Cabinet Martin", value: 2_500_000 }],
  negociation: [{ name: "Nicolas Petit", company: "Petit Immobilier", value: 1_100_000 }],
  gagne: [{ name: "Amina Traoré", company: "Traoré Design", value: 750_000 }],
};

const STAGE_ACCENT: Record<string, string> = {
  nouveau: "border-l-line",
  qualifie: "border-l-ledger",
  devis: "border-l-brass",
  negociation: "border-l-ink",
  gagne: "border-l-brass",
};

export function CrmKanbanShowcase() {
  const stages = PIPELINE_STAGES.slice(0, 4);

  return (
    <div className="overflow-hidden rounded-sm border border-line bg-paper">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <p className="text-sm font-medium text-ink">Pipeline prospects</p>
        <p className="num text-xs text-ink/50">5.8 M F CFA</p>
      </div>
      <div className="grid gap-3 overflow-x-auto p-3 sm:grid-cols-2 lg:grid-cols-4">
        {stages.map((stage) => (
          <div key={stage.id} className="min-w-[140px]">
            <p className="mb-2 truncate text-[11px] font-medium uppercase tracking-wide text-ink/50">
              {stage.label}
            </p>
            {(STAGE_CARDS[stage.id] ?? []).map((card) => (
              <article
                key={card.name}
                className={`rounded-sm border border-line border-l-[3px] bg-paper p-3 ${STAGE_ACCENT[stage.id]}`}
              >
                <h3 className="text-sm font-medium text-ink">{card.name}</h3>
                <p className="text-xs text-ink/55">{card.company}</p>
                <p className="num mt-2 text-sm font-semibold text-brass">
                  {formatMoney(card.value, "XOF")}
                </p>
              </article>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

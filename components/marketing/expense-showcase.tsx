import { formatMoney } from "@/lib/mock-data";

const EXPENSES = [
  { label: "Hébergement & domaine", category: "Logiciels", amount: 45_000, deductible: true },
  { label: "Déplacement Dakar–Abidjan", category: "Transport", amount: 180_000, deductible: true },
  { label: "Repas client", category: "Restauration", amount: 32_000, deductible: false },
];

export function ExpenseShowcase() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-sm border border-line bg-paper">
        <div className="border-b border-line px-4 py-2.5">
          <p className="text-sm font-medium text-ink">Dépenses d’août</p>
        </div>
        <ul>
          {EXPENSES.map((row, index) => (
            <li
              key={row.label}
              className={
                index === 0
                  ? "flex items-start justify-between gap-3 px-4 py-3"
                  : "flex items-start justify-between gap-3 border-t border-line px-4 py-3"
              }
            >
              <div>
                <p className="text-sm text-ink">{row.label}</p>
                <p className="mt-0.5 text-xs text-ink/50">
                  {row.category}
                  {row.deductible ? " · TVA déductible" : ""}
                </p>
              </div>
              <p className="num text-sm font-medium text-ink">
                {formatMoney(row.amount, "XOF")}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-sm border border-line bg-paper p-4">
        <p className="text-sm font-medium text-ink">Bilan TVA</p>
        <dl className="mt-4 space-y-3">
          <div>
            <div className="flex justify-between text-xs text-ink/60">
              <dt>TVA collectée</dt>
              <dd className="num">{formatMoney(332_424, "XOF")}</dd>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-sm bg-line">
              <div className="h-full w-[82%] bg-ledger" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-ink/60">
              <dt>TVA déductible</dt>
              <dd className="num">{formatMoney(40_500, "XOF")}</dd>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-sm bg-line">
              <div className="h-full w-[18%] bg-brass" />
            </div>
          </div>
        </dl>
        <div className="mt-5 flex items-end justify-between border-t border-line pt-3">
          <span className="text-sm text-ink/65">TVA à reverser</span>
          <span className="num text-xl font-semibold text-ink">
            {formatMoney(291_924, "XOF")}
          </span>
        </div>
        <p className="mt-2 text-xs text-ink/50">
          SN 18 % · ventes HT − dépenses HT = marge nette.
        </p>
      </div>
    </div>
  );
}

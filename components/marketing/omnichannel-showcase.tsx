import { ChannelBadge } from "@/components/conversations/channel-badge";
import { formatMoney } from "@/lib/mock-data";

const THREADS = [
  { initials: "AD", name: "Aminata Diallo", channel: "whatsapp" as const, preview: "Le devis a bien été envoyé hier.", unread: 2 },
  { initials: "KM", name: "Kofi Mensah", channel: "messenger" as const, preview: "Voici le récapitulatif demandé.", unread: 0 },
  { initials: "KB", name: "Karim Benali", channel: "tiktok" as const, preview: "WhatsApp et Instagram dans la même boîte.", unread: 1 },
];

export function OmnichannelShowcase() {
  return (
    <div className="overflow-hidden rounded-sm border border-line bg-paper">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <p className="text-sm font-medium text-ink">Inbox omnicanale</p>
        <p className="text-xs text-ink/50">WhatsApp · Messenger · Instagram · TikTok</p>
      </div>
      <div className="grid sm:grid-cols-[minmax(0,11rem)_1fr]">
        <ul className="border-b border-line sm:border-b-0 sm:border-r">
          {THREADS.map((thread, index) => (
            <li
              key={thread.name}
              className={
                index === 0
                  ? "flex gap-2.5 bg-ledger/8 px-3 py-2.5"
                  : "flex gap-2.5 border-t border-line px-3 py-2.5"
              }
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-muted text-xs font-medium text-ink">
                {thread.initials}
              </span>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-ink">
                    {thread.name}
                  </p>
                  {thread.unread > 0 && (
                    <span className="num rounded-sm bg-ledger px-1.5 text-[10px] font-medium text-paper">
                      {thread.unread}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-ink/50">{thread.preview}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex min-h-[220px] flex-col p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-ink">Aminata Diallo</p>
            <ChannelBadge channel="whatsapp" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <p className="max-w-[85%] rounded-sm bg-muted px-3 py-2 text-sm text-ink">
              Bonjour ! Avez-vous pu valider le devis ?
            </p>
            <p className="ml-auto max-w-[85%] rounded-sm bg-whatsapp/15 px-3 py-2 text-sm text-ink">
              Oui, tout est prêt. Voici le lien de paiement.
            </p>
            <div className="ml-auto max-w-[85%] rounded-sm border border-ledger/30 bg-ledger/8 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-ledger">
                Lien de paiement
              </p>
              <p className="num mt-0.5 text-sm font-medium text-ink">
                FAC-2026-014 · {formatMoney(1_846_800, "XOF")}
              </p>
              <p className="mt-1 text-xs text-ink/55">invomind.app/f/8k2n-atelier</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

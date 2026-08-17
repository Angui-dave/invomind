import {
  clientInitials,
} from "@/lib/data/clients";

type PortalHeaderProps = {
  companyName?: string;
  logoUrl?: string | null;
};

export function PortalHeader({
  companyName = "InvoMind",
  logoUrl,
}: PortalHeaderProps) {
  return (
    <header className="flex items-center gap-3 rounded-2xl border border-line/80 bg-card/80 p-4 shadow-sm backdrop-blur-md">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className="size-11 rounded-xl border border-line object-contain bg-muted"
        />
      ) : (
        <div
          className="flex size-11 items-center justify-center rounded-xl border border-line bg-muted font-serif text-sm font-semibold text-ink"
          aria-hidden
        >
          {clientInitials(companyName)}
        </div>
      )}
      <div>
        <p className="font-serif text-base font-semibold text-ink">
          {companyName}
        </p>
        <p className="text-xs text-ink/50">Portail de paiement sécurisé</p>
      </div>
    </header>
  );
}

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
    <header className="flex items-center gap-3 border-b border-line pb-4">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className="size-10 rounded-sm border border-line object-contain bg-muted"
        />
      ) : (
        <div
          className="flex size-10 items-center justify-center rounded-sm border border-line bg-muted font-serif text-sm font-semibold text-ink"
          aria-hidden
        >
          {clientInitials(companyName)}
        </div>
      )}
      <div>
        <p className="font-serif text-base font-semibold text-ink">
          {companyName}
        </p>
        <p className="text-xs text-ink/50">Facture</p>
      </div>
    </header>
  );
}

import {
  clientInitials,
  CURRENT_USER,
} from "@/lib/mock-data";

type PortalHeaderProps = {
  companyName?: string;
};

export function PortalHeader({
  companyName = CURRENT_USER.company,
}: PortalHeaderProps) {
  return (
    <header className="flex items-center gap-3 border-b border-line pb-4">
      <div
        className="flex size-10 items-center justify-center rounded-sm border border-line bg-muted font-serif text-sm font-semibold text-ink"
        aria-hidden
      >
        {clientInitials(companyName)}
      </div>
      <div>
        <p className="font-serif text-base font-semibold text-ink">
          {companyName}
        </p>
        <p className="text-xs text-ink/50">Facture</p>
      </div>
    </header>
  );
}

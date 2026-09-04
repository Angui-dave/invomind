import { AlertCircle } from "lucide-react";

type DalErrorBannerProps = {
  message: string;
};

/** Inline banner when a DAL list fails instead of silently showing an empty table. */
export function DalErrorBanner({ message }: DalErrorBannerProps) {
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-3 rounded-xl border border-brick/30 bg-brick/10 px-4 py-3 text-sm text-ink"
    >
      <AlertCircle
        className="mt-0.5 size-4 shrink-0 text-brick"
        aria-hidden
      />
      <div>
        <p className="font-medium text-ink">Chargement impossible</p>
        <p className="mt-0.5 text-ink/70">{message}</p>
      </div>
    </div>
  );
}

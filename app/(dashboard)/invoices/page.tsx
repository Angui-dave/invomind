import Link from "next/link";
import { Plus } from "lucide-react";
import { getCreditNotes, getInvoices } from "@/lib/dal/documents";
import { isLaravelApiEnabled } from "@/lib/config";
import { getCurrentOrganization } from "@/lib/dal/session";
import { dalErrorMessage } from "@/lib/dal/load-error";
import { getEntitlements } from "@/lib/billing/entitlements";
import { DalErrorBanner } from "@/components/dal-error-banner";
import { PageHeader } from "@/components/dashboard/page-header";
import { LimitBanner } from "@/components/feature-gate";
import { buttonVariants } from "@/components/ui/button";
import type { BusinessDocument } from "@/lib/documents";
import { parseInvoiceStatusFilter } from "@/lib/dashboard/status-filters";
import { cn } from "@/lib/utils";
import { InvoicesPageClient } from "./invoices-client";

type SearchParams = Promise<{
  status?: string;
}>;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { session } = await getCurrentOrganization();
  const entitlements = await getEntitlements(
    session.organizationId,
    session.organization.planId,
  );

  let invoices: BusinessDocument[] = [];
  let creditNotes: BusinessDocument[] = [];
  let loadError: string | null = null;
  try {
    [invoices, creditNotes] = await Promise.all([
      getInvoices(),
      getCreditNotes(),
    ]);
  } catch (error) {
    loadError = dalErrorMessage(error);
  }

  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Factures"
        description="Suivi des factures et avoirs"
        actions={
          <Link
            href="/invoices/new"
            className={cn(
              buttonVariants(),
              "h-9 rounded-full bg-ledger text-paper hover:bg-ledger/90",
            )}
          >
            <Plus className="size-4" aria-hidden />
            Nouvelle facture
          </Link>
        }
      />
      {loadError ? <DalErrorBanner message={loadError} /> : null}
      {!entitlements.canCreateInvoice &&
      entitlements.maxInvoicesPerMonth != null ? (
        <LimitBanner
          message={`Limite atteinte : ${entitlements.invoicesThisMonth}/${entitlements.maxInvoicesPerMonth} factures ce mois sur votre plan.`}
        />
      ) : null}
      <InvoicesPageClient
        invoices={invoices}
        creditNotes={creditNotes}
        status={parseInvoiceStatusFilter(params.status)}
        hideCreditNotes={isLaravelApiEnabled()}
      />
    </div>
  );
}

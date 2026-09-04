import { getCreditNotes, getInvoices } from "@/lib/dal/documents";
import { getCurrentOrganization } from "@/lib/dal/session";
import { dalErrorMessage } from "@/lib/dal/load-error";
import { getEntitlements } from "@/lib/billing/entitlements";
import { DalErrorBanner } from "@/components/dal-error-banner";
import { LimitBanner } from "@/components/feature-gate";
import type { InvoiceStatus } from "@/lib/mock-data";
import type { BusinessDocument } from "@/lib/documents";
import { InvoicesPageClient } from "./invoices-client";

type SearchParams = Promise<{
  status?: string;
}>;

const INVOICE_STATUSES: InvoiceStatus[] = [
  "draft",
  "sent",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
];

function parseInvoiceStatusFilter(value?: string): "all" | InvoiceStatus {
  if (value && INVOICE_STATUSES.includes(value as InvoiceStatus)) {
    return value as InvoiceStatus;
  }
  return "all";
}

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
    <>
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
      />
    </>
  );
}

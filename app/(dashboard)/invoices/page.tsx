import { getCreditNotes, getInvoices } from "@/lib/dal/documents";
import { getCurrentOrganization } from "@/lib/dal/session";
import { getEntitlements } from "@/lib/billing/entitlements";
import { LimitBanner } from "@/components/feature-gate";
import { InvoicesPageClient } from "./invoices-client";

export default async function InvoicesPage() {
  const { session } = await getCurrentOrganization();
  const entitlements = await getEntitlements(
    session.organizationId,
    session.organization.planId,
  );

  const [invoices, creditNotes] = await Promise.all([
    getInvoices(),
    getCreditNotes(),
  ]);

  return (
    <>
      {!entitlements.canCreateInvoice &&
      entitlements.maxInvoicesPerMonth != null ? (
        <LimitBanner
          message={`Limite atteinte : ${entitlements.invoicesThisMonth}/${entitlements.maxInvoicesPerMonth} factures ce mois sur votre plan.`}
        />
      ) : null}
      <InvoicesPageClient invoices={invoices} creditNotes={creditNotes} />
    </>
  );
}

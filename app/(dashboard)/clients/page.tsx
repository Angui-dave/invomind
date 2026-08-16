import {
  getInvoices,
  listClients,
} from "@/lib/dal/documents";
import { listProspects } from "@/lib/dal/prospects";
import { getCurrentOrganization } from "@/lib/dal/session";
import { getEntitlements } from "@/lib/billing/entitlements";
import { LimitBanner } from "@/components/feature-gate";
import { ClientsPageClient } from "./clients-client";

export default async function ClientsPage() {
  const { session, features } = await getCurrentOrganization();
  const entitlements = await getEntitlements(
    session.organizationId,
    session.organization.planId,
  );

  const [clients, prospects, invoices] = await Promise.all([
    listClients(),
    listProspects(),
    getInvoices(),
  ]);

  const invoiceCounts: Record<string, number> = {};
  const portalTokens: Record<string, string | null> = {};

  for (const client of clients) {
    const clientInvoices = invoices.filter((d) => d.clientId === client.id);
    invoiceCounts[client.id] = clientInvoices.length;

    const open = clientInvoices
      .filter(
        (d) =>
          d.status === "sent" ||
          d.status === "partially_paid" ||
          d.status === "overdue",
      )
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
    portalTokens[client.id] = open[0]?.portalToken ?? null;
  }

  return (
    <>
      {!entitlements.canCreateClient && entitlements.maxClients != null ? (
        <LimitBanner
          message={`Limite atteinte : ${entitlements.clientCount}/${entitlements.maxClients} clients sur votre plan.`}
        />
      ) : null}
      <ClientsPageClient
        initialClients={clients}
        initialProspects={prospects}
        invoiceCounts={invoiceCounts}
        portalTokens={portalTokens}
        pipelineAllowed={features.pipeline}
      />
    </>
  );
}

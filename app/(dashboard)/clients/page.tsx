import {
  getInvoices,
  listClients,
} from "@/lib/dal/documents";
import { listProspects } from "@/lib/dal/prospects";
import { getCurrentOrganization } from "@/lib/dal/session";
import { dalErrorMessage } from "@/lib/dal/load-error";
import { getEntitlements } from "@/lib/billing/entitlements";
import { DalErrorBanner } from "@/components/dal-error-banner";
import { LimitBanner } from "@/components/feature-gate";
import { ClientsPageClient } from "./clients-client";
import type { Client } from "@/lib/data/clients";
import type { Prospect } from "@/lib/data/settings";
import type { BusinessDocument } from "@/lib/documents";

export default async function ClientsPage() {
  const { session } = await getCurrentOrganization();
  const entitlements = await getEntitlements(
    session.organizationId,
    session.organization.planId,
  );

  let clients: Client[] = [];
  let prospects: Prospect[] = [];
  let invoices: BusinessDocument[] = [];
  let loadError: string | null = null;

  try {
    [clients, prospects, invoices] = await Promise.all([
      listClients(),
      listProspects(),
      getInvoices(),
    ]);
  } catch (error) {
    loadError = dalErrorMessage(error);
  }

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
      {loadError ? <DalErrorBanner message={loadError} /> : null}
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
        pipelineAllowed={true}
      />
    </>
  );
}

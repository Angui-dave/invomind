import { FeatureGate } from "@/components/feature-gate";
import { DalErrorBanner } from "@/components/dal-error-banner";
import { getAppRole } from "@/lib/rbac/guards";
import { isAdminTenant } from "@/lib/rbac/policy";
import { isLaravelApiEnabled } from "@/lib/config";
import {
  listAllMessages,
  listConversations,
  listLabels,
} from "@/lib/dal/conversations";
import { listClients, getInvoices } from "@/lib/dal/documents";
import { listProspects } from "@/lib/dal/prospects";
import { getCurrentOrganization } from "@/lib/dal/session";
import { ConversationsPageClient } from "./conversations-client";

export default async function ConversationsPage() {
  const { features, session } = await getCurrentOrganization();
  const appRole = await getAppRole();
  const laravel = isLaravelApiEnabled();

  let error: string | null = null;
  let conversations: Awaited<ReturnType<typeof listConversations>> = [];
  let messages: Awaited<ReturnType<typeof listAllMessages>> = [];
  let clients: Awaited<ReturnType<typeof listClients>> = [];
  let prospects: Awaited<ReturnType<typeof listProspects>> = [];
  let invoices: Awaited<ReturnType<typeof getInvoices>> = [];
  let labels: Awaited<ReturnType<typeof listLabels>> = [];

  try {
    [conversations, messages, clients, prospects, invoices, labels] =
      await Promise.all([
        listConversations(),
        listAllMessages(),
        listClients(),
        listProspects().catch(() => []),
        getInvoices(),
        listLabels().catch(() => []),
      ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Impossible de charger les conversations";
  }

  return (
    <FeatureGate
      allowed={features.conversations}
      featureLabel="Conversations"
      showUpgradeLink={isAdminTenant(appRole)}
    >
      {error ? <DalErrorBanner message={error} /> : null}
      <ConversationsPageClient
        initialConversations={conversations}
        initialMessages={messages}
        clients={clients}
        prospects={prospects}
        invoices={invoices}
        labels={labels}
        organizationId={session.organization.id}
        currentUserId={session.user.id}
        useRealtime={laravel}
      />
    </FeatureGate>
  );
}

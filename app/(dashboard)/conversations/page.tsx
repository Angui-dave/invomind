import {
  listAllMessages,
  listConversations,
} from "@/lib/dal/conversations";
import { listClients, getInvoices } from "@/lib/dal/documents";
import { listProspects } from "@/lib/dal/prospects";
import { getCurrentOrganization } from "@/lib/dal/session";
import { FeatureGate } from "@/components/feature-gate";
import { getAppRole } from "@/lib/rbac/guards";
import { isAdminTenant } from "@/lib/rbac/policy";
import { ConversationsPageClient } from "./conversations-client";

export default async function ConversationsPage() {
  const { features } = await getCurrentOrganization();
  const appRole = await getAppRole();
  const [conversations, messages, clients, prospects, invoices] =
    await Promise.all([
      listConversations(),
      listAllMessages(),
      listClients(),
      listProspects(),
      getInvoices(),
    ]);

  return (
    <FeatureGate
      allowed={features.conversations}
      featureLabel="Conversations"
      showUpgradeLink={isAdminTenant(appRole)}
    >
      <ConversationsPageClient
        initialConversations={conversations}
        initialMessages={messages}
        clients={clients}
        prospects={prospects}
        invoices={invoices}
      />
    </FeatureGate>
  );
}

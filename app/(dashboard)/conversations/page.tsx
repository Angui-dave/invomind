import { FeatureGate } from "@/components/feature-gate";
import { DalErrorBanner } from "@/components/dal-error-banner";
import { PageHeader } from "@/components/dashboard/page-header";
import { getAppRole } from "@/lib/rbac/guards";
import { isAdminTenant } from "@/lib/rbac/policy";
import { isLaravelApiEnabled } from "@/lib/config";
import { dalErrorMessage } from "@/lib/dal/load-error";
import {
  listAllMessages,
  listConversations,
  listLabels,
} from "@/lib/dal/conversations";
import { listClients, getInvoices } from "@/lib/dal/documents";
import { listProspects } from "@/lib/dal/prospects";
import { getCurrentOrganization } from "@/lib/dal/session";
import { ConversationsPageClient } from "./conversations-client";
import { isConversationChannel } from "@/lib/data/conversations";
import type { ChannelFilter } from "@/components/conversations/conversation-list";

type SearchParams = Promise<{
  channel?: string;
}>;

function parseChannelFilter(value?: string): ChannelFilter {
  return value && isConversationChannel(value) ? value : "all";
}

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { features, session } = await getCurrentOrganization();
  const appRole = await getAppRole();
  const laravel = isLaravelApiEnabled();
  const params = await searchParams;
  const channel = parseChannelFilter(params.channel);

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
    error = dalErrorMessage(e, "Impossible de charger les conversations");
  }

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden sm:-mx-6 lg:-mx-8 lg:-my-8 lg:h-dvh">
      <div className="shrink-0 px-4 pt-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Conversations"
          description="Messagerie omnicanal"
        />
        {error ? <DalErrorBanner message={error} /> : null}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
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
            labels={labels}
            organizationId={session.organization.id}
            currentUserId={session.user.id}
            useRealtime={laravel}
            channel={channel}
          />
        </FeatureGate>
      </div>
    </div>
  );
}

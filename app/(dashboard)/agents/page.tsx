import { assertAdminTenant } from "@/lib/rbac/guards";
import { verifySession } from "@/lib/dal/session";
import { getAgentService } from "@/lib/services/agent";
import { AgentsPageClient } from "./agents-client";

export default async function AgentsPage() {
  await assertAdminTenant();
  const session = await verifySession();
  const agents = await getAgentService().listAgents(session.organizationId);

  return <AgentsPageClient agents={agents} />;
}

import { assertAdminTenant } from "@/lib/rbac/guards";
import { listAgents, listPendingInvitations } from "@/lib/dal/agents";
import { AgentsPageClient } from "./agents-client";

export default async function AgentsPage() {
  await assertAdminTenant();
  const [agents, invitations] = await Promise.all([
    listAgents(),
    listPendingInvitations(),
  ]);

  return <AgentsPageClient agents={agents} invitations={invitations} />;
}

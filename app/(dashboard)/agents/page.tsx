import { assertAdminTenant } from "@/lib/rbac/guards";
import { listAgents, listPendingInvitations } from "@/lib/dal/agents";
import { dalErrorMessage } from "@/lib/dal/load-error";
import { DalErrorBanner } from "@/components/dal-error-banner";
import { PageHeader } from "@/components/dashboard/page-header";
import { AgentsPageClient } from "./agents-client";

export default async function AgentsPage() {
  await assertAdminTenant();

  let agents: Awaited<ReturnType<typeof listAgents>> = [];
  let invitations: Awaited<ReturnType<typeof listPendingInvitations>> = [];
  let loadError: string | null = null;

  try {
    [agents, invitations] = await Promise.all([
      listAgents(),
      listPendingInvitations(),
    ]);
  } catch (error) {
    loadError = dalErrorMessage(error);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents"
        description="Comptes agents et invitations. Un mot de passe temporaire est généré à la création."
      />
      {loadError ? <DalErrorBanner message={loadError} /> : null}
      <AgentsPageClient agents={agents} invitations={invitations} />
    </div>
  );
}

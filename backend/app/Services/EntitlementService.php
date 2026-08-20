<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Document;
use App\Models\Membership;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\Plan;
use Carbon\Carbon;

class EntitlementService
{
    public function check(string $organizationId): array
    {
        $org = Organization::with(['plan', 'subscription', 'features'])->findOrFail($organizationId);
        $plan = $org->plan ?? Plan::find('free');
        $features = $org->features;

        $invoicesThisMonth = Document::where('organization_id', $organizationId)
            ->where('kind', 'invoice')
            ->where('created_at', '>=', Carbon::now()->startOfMonth())
            ->count();

        $clientCount = Client::where('organization_id', $organizationId)->count();

        $pipeline = (bool) $plan->pipeline && ($features?->pipeline ?? true);
        $conversations = (bool) $plan->conversations && ($features?->conversations ?? true);
        $reports = (bool) $plan->reports && ($features?->reports ?? true);
        $expenses = (bool) ($plan->expenses ?? true) && ($features?->expenses ?? true);
        $catalog = (bool) ($plan->catalog ?? true) && ($features?->catalog ?? true);
        $importTool = (bool) ($plan->import_tool ?? false) && ($features?->import_tool ?? true);

        return [
            'plan_id' => $plan->id,
            'can_create_invoice' => $plan->max_invoices_per_month === null
                || $invoicesThisMonth < $plan->max_invoices_per_month,
            'invoices_used' => $invoicesThisMonth,
            'invoices_limit' => $plan->max_invoices_per_month,
            'can_create_client' => $plan->max_clients === null
                || $clientCount < $plan->max_clients,
            'clients_used' => $clientCount,
            'clients_limit' => $plan->max_clients,
            'max_agents' => $plan->max_agents,
            'agents_used' => $this->agentSeatsUsed($organizationId),
            'can_invite_agent' => $this->canInviteAgent($organizationId, $plan),
            'auto_reminders' => (bool) $plan->auto_reminders,
            'online_payments' => (bool) $plan->online_payments,
            'pipeline' => $pipeline,
            'conversations' => $conversations,
            'reports' => $reports,
            'expenses' => $expenses,
            'catalog' => $catalog,
            'import_tool' => $importTool,
        ];
    }

    public function canAutoRemind(string $organizationId): bool
    {
        return (bool) $this->check($organizationId)['auto_reminders'];
    }

    public function assertCanCreateInvoice(string $organizationId): void
    {
        $ent = $this->check($organizationId);
        if (! $ent['can_create_invoice']) {
            abort(403, 'Invoice limit reached for current plan.');
        }
    }

    public function assertCanCreateClient(string $organizationId): void
    {
        $ent = $this->check($organizationId);
        if (! $ent['can_create_client']) {
            abort(403, 'Client limit reached for current plan.');
        }
    }

    public function assertCanInviteAgent(string $organizationId): void
    {
        $ent = $this->check($organizationId);
        if (! $ent['can_invite_agent']) {
            abort(403, 'Les invitations d’équipe sont réservées au plan Pro (3 membres).');
        }
    }

    public function assertOnlinePayments(string $organizationId): void
    {
        $ent = $this->check($organizationId);
        if (! $ent['online_payments']) {
            abort(403, 'Online payments require a higher plan.');
        }
    }

    public function assertModule(string $organizationId, string $module): void
    {
        $ent = $this->check($organizationId);
        $key = match ($module) {
            'importTool', 'import_tool' => 'import_tool',
            default => $module,
        };

        if (! ($ent[$key] ?? false)) {
            abort(403, 'Cette fonctionnalité n’est pas incluse dans votre plan ou a été désactivée.');
        }
    }

    private function canInviteAgent(string $organizationId, Plan $plan): bool
    {
        if ($plan->max_agents === 0) {
            return false;
        }

        if ($plan->max_agents === null) {
            return true;
        }

        return $this->agentSeatsUsed($organizationId) < $plan->max_agents;
    }

    private function agentSeatsUsed(string $organizationId): int
    {
        $members = Membership::query()
            ->where('organization_id', $organizationId)
            ->where('role', 'member')
            ->count();

        $pending = OrganizationInvitation::query()
            ->where('organization_id', $organizationId)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->count();

        return $members + $pending;
    }
}

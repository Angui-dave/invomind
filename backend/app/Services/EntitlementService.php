<?php

namespace App\Services;

use App\Enums\AbonnementStatut;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Organization;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Carbon\Carbon;

class EntitlementService
{
    public function check(int|string $organizationId): array
    {
        $org = Organization::findOrFail($organizationId);
        $subscription = Subscription::query()
            ->where('orga_id', $organizationId)
            ->whereIn('statut', [AbonnementStatut::EnCours, AbonnementStatut::Essai])
            ->latest('id')
            ->first();

        $plan = $subscription?->plan
            ?? Plan::query()->where('code', 'gratuit')->firstOrFail();

        $invoicesThisMonth = Invoice::query()
            ->where('orga_id', $organizationId)
            ->where('created_at', '>=', Carbon::now()->startOfMonth())
            ->count();

        $clientCount = Client::query()->where('orga_id', $organizationId)->count();
        $userCount = User::query()->where('orga_id', $organizationId)->where('is_active', true)->count();

        $fonctionnalites = is_array($plan->fonctionnalites) ? $plan->fonctionnalites : [];

        return [
            'plan_id' => $plan->code,
            'plan_code' => $plan->code,
            'can_create_invoice' => $plan->limite_factures_mois === null
                || $invoicesThisMonth < $plan->limite_factures_mois,
            'invoices_used' => $invoicesThisMonth,
            'invoices_limit' => $plan->limite_factures_mois,
            'can_create_client' => $plan->limite_clients === null
                || $clientCount < $plan->limite_clients,
            'clients_used' => $clientCount,
            'clients_limit' => $plan->limite_clients,
            'max_agents' => $plan->limite_utilisateurs,
            'agents_used' => $userCount,
            'can_invite_agent' => $plan->limite_utilisateurs === null
                || $userCount < $plan->limite_utilisateurs,
            'auto_reminders' => (bool) ($fonctionnalites['auto_reminders'] ?? $plan->code !== 'gratuit'),
            'online_payments' => (bool) ($fonctionnalites['online_payments'] ?? $plan->code !== 'gratuit'),
            'pipeline' => (bool) ($fonctionnalites['pipeline'] ?? true),
            // Conversations available on all plans (including free) once the module is shipped.
            'conversations' => (bool) ($fonctionnalites['conversations'] ?? true),
            'reports' => true,
            'expenses' => true,
            'catalog' => true,
            'import_tool' => $plan->code !== 'gratuit',
            'organization' => [
                'id' => $org->id,
                'uuid' => $org->uuid,
                'name_company' => $org->name_company,
            ],
        ];
    }

    public function canAutoRemind(int|string $organizationId): bool
    {
        return (bool) $this->check($organizationId)['auto_reminders'];
    }

    public function assertCanCreateInvoice(int|string $organizationId): void
    {
        $ent = $this->check($organizationId);
        if (! $ent['can_create_invoice']) {
            abort(403, 'Invoice limit reached for current plan.');
        }
    }

    public function assertCanCreateClient(int|string $organizationId): void
    {
        $ent = $this->check($organizationId);
        if (! $ent['can_create_client']) {
            abort(403, 'Client limit reached for current plan.');
        }
    }

    public function assertCanInviteAgent(int|string $organizationId): void
    {
        $ent = $this->check($organizationId);
        if (! $ent['can_invite_agent']) {
            abort(403, 'Limite d’utilisateurs atteinte pour votre plan.');
        }
    }

    public function assertOnlinePayments(int|string $organizationId): void
    {
        $ent = $this->check($organizationId);
        if (! $ent['online_payments']) {
            abort(403, 'Online payments require a higher plan.');
        }
    }

    public function assertModule(int|string $organizationId, string $module): void
    {
        $ent = $this->check($organizationId);
        $key = match ($module) {
            'importTool', 'import_tool' => 'import_tool',
            default => $module,
        };

        if (! ($ent[$key] ?? false)) {
            abort(403, 'Cette fonctionnalité n’est pas incluse dans votre plan.');
        }
    }
}

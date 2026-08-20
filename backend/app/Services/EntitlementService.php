<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Document;
use App\Models\Organization;
use App\Models\Plan;
use Carbon\Carbon;

class EntitlementService
{
    public function check(string $organizationId): array
    {
        $org = Organization::with('plan', 'subscription')->findOrFail($organizationId);
        $plan = $org->plan ?? Plan::find('free');

        $invoicesThisMonth = Document::where('organization_id', $organizationId)
            ->where('kind', 'invoice')
            ->where('created_at', '>=', Carbon::now()->startOfMonth())
            ->count();

        $clientCount = Client::where('organization_id', $organizationId)->count();

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
            'auto_reminders' => $plan->auto_reminders,
            'online_payments' => $plan->online_payments,
            'pipeline' => $plan->pipeline,
            'conversations' => $plan->conversations,
            'reports' => $plan->reports,
        ];
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
}

<?php

namespace Tests\Concerns;

use App\Models\Client;
use App\Models\Membership;
use App\Models\Organization;
use App\Models\OrganizationBranding;
use App\Models\OrganizationFeatures;
use App\Models\OrganizationSettings;
use App\Models\Plan;
use App\Models\User;
use App\Services\DefaultEmailTemplateService;
use App\Services\OrganizationBootstrapService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

trait CreatesTenant
{
    protected User $user;

    protected Organization $organization;

    protected Client $client;

    protected function seedTenant(string $planId = 'pro'): void
    {
        $this->ensurePlan('free', 5, 10);
        $this->ensurePlan('pro', null, null);

        $this->user = User::create([
            'name' => 'Lea Diallo',
            'email' => 'lea-'.Str::random(8).'@test.invomind',
            'password_hash' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        $this->organization = Organization::create([
            'name' => 'Atelier Diallo',
            'slug' => 'atelier-'.Str::random(6),
            'plan_id' => $planId,
        ]);

        Membership::create([
            'organization_id' => $this->organization->id,
            'user_id' => $this->user->id,
            'role' => 'owner',
        ]);

        OrganizationSettings::create([
            'organization_id' => $this->organization->id,
            'company_name' => 'Atelier Diallo',
            'email' => 'contact@atelier.test',
            'tax_id' => 'SN123456',
            'country' => 'SN',
        ]);

        OrganizationBranding::create([
            'organization_id' => $this->organization->id,
        ]);

        OrganizationFeatures::create([
            'organization_id' => $this->organization->id,
            'pipeline' => true,
            'conversations' => true,
            'expenses' => true,
            'catalog' => true,
            'reports' => true,
            'import_tool' => true,
        ]);

        app(DefaultEmailTemplateService::class)->seedFor($this->organization);
        app(OrganizationBootstrapService::class)->seedExpenseCategories($this->organization);

        $this->client = Client::create([
            'organization_id' => $this->organization->id,
            'name' => 'Aminata Ndiaye',
            'company' => 'Ndiaye SARL',
            'email' => 'aminata@ndiaye.test',
            'portal_token' => Str::random(32),
        ]);

        Sanctum::actingAs($this->user);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function createAndIssueDocument(array $overrides = []): array
    {
        $draft = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents', $this->documentPayload($overrides))
            ->assertCreated()
            ->json();

        return $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents/'.$draft['id'].'/issue')
            ->assertOk()
            ->json();
    }

    protected function ensurePlan(string $id, ?int $maxInvoices, ?int $maxClients): void
    {
        Plan::query()->updateOrCreate(['id' => $id], [
            'name' => $id === 'pro' ? 'Pro' : 'Gratuit',
            'price' => $id === 'pro' ? 9900 : 0,
            'price_label' => $id === 'pro' ? '9 900 XOF/mois' : '0 XOF/mois',
            'description' => 'test',
            'features' => [],
            'highlighted' => $id === 'pro',
            'max_invoices_per_month' => $maxInvoices,
            'max_clients' => $maxClients,
            'max_agents' => $id === 'pro' ? 3 : 0,
            'auto_reminders' => $id === 'pro',
            'online_payments' => $id === 'pro',
            'pipeline' => $id === 'pro',
            'conversations' => $id === 'pro',
            'reports' => true,
            'expenses' => true,
            'catalog' => true,
            'import_tool' => $id === 'pro',
        ]);
    }

    /**
     * @return array<string, string>
     */
    protected function tenantHeaders(): array
    {
        return [
            'Accept' => 'application/json',
            'X-Organization-Id' => $this->organization->id,
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function documentPayload(array $overrides = []): array
    {
        return array_merge([
            'kind' => 'invoice',
            'client_id' => $this->client->id,
            'status' => 'draft',
            'currency' => 'XOF',
            'tax_mode' => 'exclusive',
            'issue_date' => '2026-08-20',
            'due_date' => '2026-09-20',
            'lines' => [
                [
                    'description' => 'Prestation',
                    'quantity' => 1,
                    'unit_price' => 100000,
                    'tax_rate' => 18,
                ],
            ],
        ], $overrides);
    }
}

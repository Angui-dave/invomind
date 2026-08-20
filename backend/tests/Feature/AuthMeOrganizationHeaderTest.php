<?php

namespace Tests\Feature;

use App\Models\Membership;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class AuthMeOrganizationHeaderTest extends TestCase
{
    use CreatesTenant;
    use RefreshDatabase;

    public function test_me_respects_x_organization_id_header(): void
    {
        $this->seedTenant('pro');

        $orgB = Organization::create([
            'name' => 'Second Org',
            'slug' => 'second-'.Str::random(6),
            'plan_id' => 'free',
        ]);

        Membership::create([
            'organization_id' => $orgB->id,
            'user_id' => $this->user->id,
            'role' => 'member',
        ]);

        $this->withHeaders([
            'Accept' => 'application/json',
            'X-Organization-Id' => $orgB->id,
        ])
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('organization_id', $orgB->id)
            ->assertJsonPath('role', 'member')
            ->assertJsonMissingPath('token');
    }

    public function test_me_falls_back_to_first_membership_without_header(): void
    {
        $this->seedTenant('pro');

        $this->withHeaders(['Accept' => 'application/json'])
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('organization_id', $this->organization->id)
            ->assertJsonPath('role', 'owner');
    }

    public function test_quote_status_transition(): void
    {
        $this->seedTenant('pro');

        $draft = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents', $this->documentPayload([
                'kind' => 'quote',
                'due_date' => '2026-09-20',
            ]))
            ->assertCreated()
            ->json();

        $issued = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents/'.$draft['id'].'/issue')
            ->assertOk()
            ->json();

        $this->assertSame('sent', $issued['status']);
        $this->assertArrayNotHasKey('snapshot_json', $issued);
        $this->assertArrayNotHasKey('pdf_disk_path', $issued);

        $this->withHeaders($this->tenantHeaders())
            ->putJson('/api/documents/'.$draft['id'].'/status', ['status' => 'accepted'])
            ->assertOk()
            ->assertJsonPath('status', 'accepted');
    }

    public function test_organization_includes_subscription_invoices(): void
    {
        $this->seedTenant('pro');

        \App\Models\SubscriptionInvoice::create([
            'organization_id' => $this->organization->id,
            'date' => now()->toDateString(),
            'description' => 'Test invoice',
            'amount' => 9900,
            'currency' => 'XOF',
            'status' => 'paid',
        ]);

        $this->withHeaders($this->tenantHeaders())
            ->getJson('/api/organization')
            ->assertOk()
            ->assertJsonStructure(['subscription_invoices']);
    }

    public function test_paid_plan_change_requires_cinetpay_checkout(): void
    {
        $this->seedTenant('free');

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/billing/change-plan', ['plan_id' => 'pro'])
            ->assertStatus(402);
    }
}

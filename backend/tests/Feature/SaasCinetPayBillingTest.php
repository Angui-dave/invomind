<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Organization;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\SubscriptionBillingService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class SaasCinetPayBillingTest extends TestCase
{
    use CreatesTenant;
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();

        if ($this->app->make('db')->connection()->getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Requires PostgreSQL.');
        }

        $this->seedTenant('free');
        Plan::query()->updateOrCreate(['id' => 'business'], [
            'name' => 'Business',
            'price' => 29000,
            'price_label' => '29 000 XOF/mois',
            'description' => 'test',
            'features' => [],
            'highlighted' => false,
            'max_invoices_per_month' => null,
            'max_clients' => null,
            'max_agents' => 10,
            'auto_reminders' => true,
            'online_payments' => true,
            'pipeline' => true,
            'conversations' => true,
            'reports' => true,
            'expenses' => true,
            'catalog' => true,
            'import_tool' => true,
        ]);
    }

    public function test_change_plan_paid_returns_402(): void
    {
        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/billing/change-plan', ['plan_id' => 'pro'])
            ->assertStatus(402);
    }

    public function test_billing_checkout_creates_saas_intent(): void
    {
        $response = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/billing/checkout', [
                'plan_id' => 'pro',
                'customer_phone' => '+221771234567',
            ])
            ->assertCreated();

        $response->assertJsonPath('payment_intent.purpose', 'saas_plan')
            ->assertJsonPath('payment_intent.plan_id', 'pro')
            ->assertJsonMissingPath('payment_intent.raw_payload');

        $this->assertNotEmpty($response->json('checkout_url'));
        $this->assertDatabaseHas('payment_intents', [
            'id' => $response->json('payment_intent.id'),
            'purpose' => 'saas_plan',
            'plan_id' => 'pro',
            'document_id' => null,
        ]);
    }

    public function test_saas_webhook_activates_plan_for_30_days(): void
    {
        $intentId = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/billing/checkout', ['plan_id' => 'pro'])
            ->json('payment_intent.id');

        $service = $this->app->make(SubscriptionBillingService::class);
        $result = $service->applySucceededWebhook(
            'cinetpay',
            $intentId,
            '9900.00',
            ['cpm_trans_id' => $intentId],
            $intentId,
        );

        $this->assertTrue($result['activated']);
        $this->assertSame('pro', $this->organization->fresh()->plan_id);

        $sub = Subscription::where('organization_id', $this->organization->id)->first();
        $this->assertSame('active', $sub->status);
        $this->assertSame('pro', $sub->plan_id);
        $this->assertNotNull($sub->current_period_end);
    }

    public function test_expire_overdue_downgrades_to_free(): void
    {
        $this->organization->update(['plan_id' => 'pro']);
        Subscription::create([
            'organization_id' => $this->organization->id,
            'plan_id' => 'pro',
            'status' => 'active',
            'current_period_start' => now()->subDays(40)->toIso8601String(),
            'current_period_end' => now()->subDay()->toIso8601String(),
        ]);

        $count = $this->app->make(SubscriptionBillingService::class)->expireOverdue();
        $this->assertSame(1, $count);
        $this->assertSame('free', $this->organization->fresh()->plan_id);
    }

    public function test_document_rejects_foreign_client_id(): void
    {
        $otherOrg = Organization::create([
            'name' => 'Other',
            'slug' => 'other-'.Str::random(6),
            'plan_id' => 'pro',
        ]);
        $foreignClient = Client::create([
            'organization_id' => $otherOrg->id,
            'name' => 'Foreign',
            'company' => 'X',
            'email' => 'f@x.test',
            'portal_token' => Str::random(32),
        ]);

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/documents', $this->documentPayload([
                'client_id' => $foreignClient->id,
            ]))
            ->assertStatus(422);
    }

    public function test_webhook_config_returns_full_url(): void
    {
        $url = 'https://8.8.8.8/hooks/invomind';

        $this->withHeaders($this->tenantHeaders())
            ->putJson('/api/conversations/webhook', [
                'url' => $url,
                'enabled' => true,
                'secret' => 'abc',
            ])
            ->assertOk()
            ->assertJsonPath('config.url', $url)
            ->assertJsonPath('config.has_secret', true);

        $this->withHeaders($this->tenantHeaders())
            ->getJson('/api/conversations/webhook')
            ->assertOk()
            ->assertJsonPath('config.url', $url);
    }

    public function test_stripe_route_removed(): void
    {
        $this->postJson('/api/webhooks/stripe', [])->assertNotFound();
    }
}

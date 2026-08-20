<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Membership;
use App\Models\Organization;
use App\Models\WebhookConfig;
use App\Services\WebhookService;
use App\Support\SafeOutboundUrl;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    use CreatesTenant;
    use RefreshDatabase;

    public function test_paid_billing_change_requires_checkout(): void
    {
        $this->seedTenant('free');

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/billing/change-plan', ['plan_id' => 'pro'])
            ->assertStatus(402);

        $this->assertSame('free', $this->organization->fresh()->plan_id);
    }

    public function test_free_plan_change_is_allowed(): void
    {
        $this->seedTenant('pro');

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/billing/change-plan', ['plan_id' => 'free'])
            ->assertOk()
            ->assertJsonPath('organization.plan_id', 'free');
    }

    public function test_webhook_config_update_does_not_return_secret(): void
    {
        $this->seedTenant('pro');

        $response = $this->withHeaders($this->tenantHeaders())
            ->putJson('/api/conversations/webhook', [
                'url' => 'https://example.com/hooks/invomind',
                'enabled' => true,
                'secret' => 'super-secret-value',
            ])
            ->assertOk();

        $response->assertJsonMissing(['secret' => 'super-secret-value'])
            ->assertJsonPath('config.has_secret', true)
            ->assertJsonMissingPath('config.secret');

        $this->assertSame(
            'super-secret-value',
            WebhookConfig::query()->find($this->organization->id)?->secret
        );
    }

    public function test_safe_outbound_url_rejects_private_hosts(): void
    {
        $this->assertFalse(SafeOutboundUrl::isAllowed('http://example.com/hook'));
        $this->assertFalse(SafeOutboundUrl::isAllowed('https://127.0.0.1/hook'));
        $this->assertFalse(SafeOutboundUrl::isAllowed('https://localhost/hook'));
        $this->assertFalse(SafeOutboundUrl::isAllowed('https://169.254.169.254/latest'));
        $this->assertFalse(SafeOutboundUrl::isAllowed('https://10.0.0.1/internal'));
        $this->assertTrue(SafeOutboundUrl::isAllowed('https://8.8.8.8/hooks'));
    }

    public function test_meta_signature_rejects_empty_secret(): void
    {
        $service = app(WebhookService::class);
        $payload = '{"object":"page"}';
        $signature = 'sha256='.hash_hmac('sha256', $payload, '');

        $this->assertFalse($service->verifyMetaSignature($payload, $signature, ''));
        $this->assertFalse($service->verifyMetaSignature($payload, $signature, null));
    }

    public function test_conversation_send_scopes_to_tenant(): void
    {
        $this->seedTenant('pro');

        $otherOrg = Organization::create([
            'name' => 'Other',
            'slug' => 'other-'.Str::random(6),
            'plan_id' => 'pro',
        ]);

        $foreign = Conversation::create([
            'organization_id' => $otherOrg->id,
            'channel' => 'whatsapp',
            'contact_name' => 'Foreign',
            'contact_handle' => '221770000000',
            'last_message_at' => now(),
        ]);

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/conversations/send', [
                'conversation_id' => $foreign->id,
                'channel' => 'whatsapp',
                'to' => '221770000000',
                'body' => 'cross tenant',
            ])
            ->assertNotFound();
    }

    public function test_login_revokes_previous_api_tokens(): void
    {
        $this->seedTenant('pro');

        $password = 'password123';
        $this->user->forceFill([
            'password_hash' => Hash::make($password),
        ])->save();

        $this->user->createToken('api');
        $this->assertSame(1, $this->user->tokens()->where('name', 'api')->count());

        $this->postJson('/api/auth/login', [
            'email' => $this->user->email,
            'password' => $password,
        ])->assertOk()
            ->assertJsonStructure(['token']);

        $this->assertSame(1, $this->user->tokens()->where('name', 'api')->count());
    }

    public function test_stripe_webhook_route_is_gone(): void
    {
        $this->postJson('/api/webhooks/stripe', [])
            ->assertNotFound();
    }

    public function test_member_cannot_update_email_templates(): void
    {
        $this->seedTenant('pro');

        $membership = Membership::query()
            ->where('organization_id', $this->organization->id)
            ->where('user_id', $this->user->id)
            ->firstOrFail();
        $membership->update(['role' => 'member']);

        $this->withHeaders($this->tenantHeaders())
            ->putJson('/api/email-templates/document_sent', [
                'subject' => 'Hacked',
                'body' => 'nope',
            ])
            ->assertForbidden();
    }

    public function test_admin_cannot_invite_another_admin(): void
    {
        $this->seedTenant('pro');

        Membership::query()
            ->where('organization_id', $this->organization->id)
            ->where('user_id', $this->user->id)
            ->update(['role' => 'admin']);

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/organization/invitations', [
                'email' => 'admin2-'.Str::random(6).'@test.invomind',
                'role' => 'admin',
            ])
            ->assertForbidden();
    }

    public function test_import_rejects_more_than_500_rows(): void
    {
        $this->seedTenant('pro');

        $rows = array_fill(0, 501, ['name' => 'A', 'email' => 'a@test.com']);

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/import/clients', ['rows' => $rows])
            ->assertStatus(422);
    }

    public function test_member_cannot_import_or_view_reports(): void
    {
        $this->seedTenant('pro');

        Membership::query()
            ->where('organization_id', $this->organization->id)
            ->where('user_id', $this->user->id)
            ->update(['role' => 'member']);

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/import/clients', [
                'rows' => [['name' => 'A', 'email' => 'a@test.com']],
            ])
            ->assertForbidden();

        $this->withHeaders($this->tenantHeaders())
            ->getJson('/api/reports/dashboard')
            ->assertForbidden();
    }
}

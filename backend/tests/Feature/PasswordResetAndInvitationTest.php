<?php

namespace Tests\Feature;

use App\Mail\InvitationMail;
use App\Models\Membership;
use App\Models\OrganizationInvitation;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class PasswordResetAndInvitationTest extends TestCase
{
    use CreatesTenant;
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();

        if ($this->app->make('db')->connection()->getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Requires PostgreSQL (native enums and row locks).');
        }

        Mail::fake();
        Notification::fake();
        $this->seedTenant();
    }

    public function test_reset_with_used_token_returns_unprocessable(): void
    {
        $this->postJson('/api/auth/forgot-password', [
            'email' => $this->user->email,
        ])->assertOk();

        $token = null;
        Notification::assertSentTo($this->user, ResetPassword::class, function (ResetPassword $notification) use (&$token) {
            $token = $notification->token;

            return true;
        });

        $this->assertNotNull($token);

        $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'new-password-123',
        ])->assertOk();

        $this->assertTrue(Hash::check('new-password-123', $this->user->fresh()->password_hash));

        $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => $this->user->email,
            'password' => 'another-password-123',
        ])->assertStatus(422);
    }

    public function test_expired_invitation_returns_gone(): void
    {
        $plain = $this->inviteCommercial();

        OrganizationInvitation::query()
            ->where('organization_id', $this->organization->id)
            ->update(['expires_at' => now()->subDay()]);

        $this->postJson('/api/auth/invitations/accept', [
            'token' => $plain,
            'name' => 'Fatou Ba',
            'password' => 'password123',
        ])->assertStatus(410);

        $this->assertSame(0, User::query()->where('email', 'fatou@test.invomind')->count());
        $this->assertNull(OrganizationInvitation::query()->where('email', 'fatou@test.invomind')->value('accepted_at'));
    }

    public function test_accept_invitation_creates_user_and_membership(): void
    {
        $plain = $this->inviteCommercial();

        $this->postJson('/api/auth/invitations/accept', [
            'token' => $plain,
            'name' => 'Fatou Ba',
            'password' => 'password123',
        ])
            ->assertCreated()
            ->assertJsonPath('role', 'member')
            ->assertJsonPath('organization_id', $this->organization->id);

        $invitee = User::query()->where('email', 'fatou@test.invomind')->first();
        $this->assertNotNull($invitee);
        $this->assertTrue(Hash::check('password123', $invitee->password_hash));

        $this->assertDatabaseHas('memberships', [
            'organization_id' => $this->organization->id,
            'user_id' => $invitee->id,
            'role' => 'member',
        ]);

        $this->assertNotNull(
            OrganizationInvitation::query()->where('email', 'fatou@test.invomind')->value('accepted_at'),
        );

        $this->postJson('/api/auth/invitations/accept', [
            'token' => $plain,
            'name' => 'Fatou Ba',
            'password' => 'password123',
        ])->assertStatus(410);
    }

    public function test_free_plan_cannot_invite(): void
    {
        $this->organization->update(['plan_id' => 'free']);

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/organization/invitations', [
                'email' => 'fatou@test.invomind',
            ])
            ->assertForbidden();

        Mail::assertNothingSent();
        $this->assertSame(0, OrganizationInvitation::query()->count());
    }

    public function test_agents_index_lists_members_and_disable_sets_flag(): void
    {
        $plain = $this->inviteCommercial();
        $this->postJson('/api/auth/invitations/accept', [
            'token' => $plain,
            'name' => 'Fatou Ba',
            'password' => 'password123',
        ])->assertCreated();

        $agents = $this->withHeaders($this->tenantHeaders())
            ->getJson('/api/agents')
            ->assertOk()
            ->json();

        $this->assertCount(1, $agents);
        $this->assertSame('fatou@test.invomind', $agents[0]['email']);
        $this->assertSame('active', $agents[0]['status']);

        $this->withHeaders($this->tenantHeaders())
            ->putJson('/api/agents/'.$agents[0]['id'].'/disable')
            ->assertOk()
            ->assertJsonPath('status', 'disabled');

        $this->assertNotNull(Membership::query()->find($agents[0]['id'])->disabled_at);
    }

    private function inviteCommercial(): string
    {
        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/organization/invitations', [
                'email' => 'fatou@test.invomind',
                'role' => 'member',
            ])
            ->assertCreated();

        $plain = null;
        Mail::assertSent(InvitationMail::class, function (InvitationMail $mail) use (&$plain) {
            $plain = $mail->plainToken;

            return $mail->hasTo('fatou@test.invomind');
        });

        $this->assertNotEmpty($plain);

        return $plain;
    }
}

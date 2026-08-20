<?php

namespace Tests\Feature;

use App\Models\InboundMessage;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class ConversationsInboxAndChannelsTest extends TestCase
{
    use CreatesTenant;
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();

        if ($this->app->make('db')->connection()->getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Requires PostgreSQL (native enums).');
        }

        $this->seedTenant('pro');
    }

    public function test_inbox_filters_on_sent_at(): void
    {
        InboundMessage::query()->create([
            'id' => (string) Str::uuid(),
            'organization_id' => $this->organization->id,
            'channel' => 'whatsapp',
            'handle' => '+221770000001',
            'body' => 'ancien',
            'sent_at' => '2026-08-01T10:00:00.000000Z',
            'contact_name' => 'Aminata',
            'thread_ref' => 'old',
        ]);
        InboundMessage::query()->create([
            'id' => (string) Str::uuid(),
            'organization_id' => $this->organization->id,
            'channel' => 'whatsapp',
            'handle' => '+221770000002',
            'body' => 'récent',
            'sent_at' => '2026-08-20T10:00:00.000000Z',
            'contact_name' => 'Aminata',
            'thread_ref' => 'new',
        ]);

        $this->withHeaders($this->tenantHeaders())
            ->getJson('/api/conversations/inbox?since=2026-08-10T00:00:00.000000Z')
            ->assertOk()
            ->assertJsonCount(1, 'messages')
            ->assertJsonPath('messages.0.body', 'récent');
    }

    public function test_channel_connection_crud(): void
    {
        $created = $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/conversations/channels', [
                'channel' => 'whatsapp',
                'external_id' => 'page-123',
                'display_name' => 'Atelier WA',
            ])
            ->assertCreated()
            ->assertJsonPath('channel', 'whatsapp')
            ->assertJsonPath('external_id', 'page-123')
            ->json();

        $this->withHeaders($this->tenantHeaders())
            ->getJson('/api/conversations/channels')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $created['id']);

        $this->withHeaders($this->tenantHeaders())
            ->deleteJson('/api/conversations/channels/'.$created['id'])
            ->assertNoContent();

        $this->withHeaders($this->tenantHeaders())
            ->getJson('/api/conversations/channels')
            ->assertOk()
            ->assertExactJson([]);
    }

    public function test_webhook_test_endpoint_returns_skipped_without_url(): void
    {
        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/conversations/webhook/test')
            ->assertOk()
            ->assertJsonPath('status', 'skipped');
    }
}

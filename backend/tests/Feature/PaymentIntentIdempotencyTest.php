<?php

namespace Tests\Feature;

use App\Exceptions\InvalidPspAmountException;
use App\Models\Document;
use App\Models\Payment;
use App\Models\PaymentIntent;
use App\Services\DocumentPaymentService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class PaymentIntentIdempotencyTest extends TestCase
{
    use CreatesTenant;
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();

        if ($this->app->make('db')->connection()->getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Requires PostgreSQL (native enums and row locks).');
        }

        $this->seedTenant();
    }

    public function test_portal_pay_is_gone_and_does_not_create_a_payment(): void
    {
        $token = $this->issuedInvoiceToken();

        $this->postJson('/api/portal/'.$token.'/pay', [
            'amount' => 118000,
            'method' => 'mobile_money',
        ])
            ->assertStatus(410);

        $this->assertSame(0, Payment::query()->where('organization_id', $this->organization->id)->count());
    }

    public function test_checkout_creates_a_pending_intent_for_the_outstanding_balance(): void
    {
        $token = $this->issuedInvoiceToken();

        $response = $this->postJson('/api/portal/'.$token.'/checkout', [
            'method_hint' => 'wave',
            'customer_phone' => '+221771234567',
        ]);

        $response->assertCreated()
            ->assertJsonPath('payment_intent.status', 'processing')
            ->assertJsonPath('outstanding_balance', '118000.00')
            ->assertJsonMissingPath('payment_intent.raw_payload')
            ->assertJsonMissingPath('payment_intent.provider');

        $this->assertSame('118000.00', $response->json('payment_intent.amount'));
        $this->assertNotEmpty($response->json('payment_intent.checkout_url'));
        $this->assertDatabaseHas('payment_intents', [
            'id' => $response->json('payment_intent.id'),
            'provider' => 'cinetpay',
            'method_hint' => 'wave',
        ]);
    }

    public function test_checkout_reuses_an_open_intent(): void
    {
        $token = $this->issuedInvoiceToken();

        $first = $this->postJson('/api/portal/'.$token.'/checkout')->json('payment_intent.id');
        $second = $this->postJson('/api/portal/'.$token.'/checkout')->json('payment_intent.id');

        $this->assertSame($first, $second);
        $this->assertSame(1, PaymentIntent::query()->where('document_id', $this->documentIdFromToken($token))->count());
    }

    public function test_webhook_replay_does_not_duplicate_payment(): void
    {
        $token = $this->issuedInvoiceToken();
        $intentId = $this->postJson('/api/portal/'.$token.'/checkout', [
            'method_hint' => 'wave',
            'customer_phone' => '+221771234567',
        ])->json('payment_intent.id');

        $service = $this->app->make(DocumentPaymentService::class);
        $payload = ['cpm_trans_id' => $intentId, 'cpm_amount' => '118000'];

        $first = $service->applySucceededWebhook(
            'cinetpay',
            $intentId,
            '118000.00',
            $payload,
            $intentId,
        );
        $second = $service->applySucceededWebhook(
            'cinetpay',
            $intentId,
            '118000.00',
            $payload,
            $intentId,
        );

        $this->assertSame($first->id, $second->id);
        $this->assertSame(1, Payment::query()->where('payment_intent_id', $intentId)->count());
        $this->assertDatabaseHas('documents', [
            'portal_token' => $token,
            'status' => 'paid',
        ]);
        $this->assertDatabaseHas('payment_intents', [
            'id' => $intentId,
            'status' => 'succeeded',
            'provider_transaction_id' => $intentId,
        ]);
        $this->assertDatabaseHas('payments', [
            'source' => 'portal_psp',
            'provider' => 'cinetpay',
            'provider_transaction_id' => $intentId,
        ]);
    }

    public function test_webhook_with_tampered_amount_is_rejected(): void
    {
        $token = $this->issuedInvoiceToken();
        $intentId = $this->postJson('/api/portal/'.$token.'/checkout')->json('payment_intent.id');

        $this->expectException(InvalidPspAmountException::class);

        $this->app->make(DocumentPaymentService::class)->applySucceededWebhook(
            'cinetpay',
            $intentId,
            '1.00',
            [],
            $intentId,
        );
    }

    public function test_checkout_on_already_paid_document_conflicts(): void
    {
        $token = $this->issuedInvoiceToken();
        $intentId = $this->postJson('/api/portal/'.$token.'/checkout')->json('payment_intent.id');

        $this->app->make(DocumentPaymentService::class)->applySucceededWebhook(
            'cinetpay',
            $intentId,
            '118000.00',
            [],
            $intentId,
        );

        $this->postJson('/api/portal/'.$token.'/checkout')->assertStatus(409);
    }

    public function test_manual_dashboard_payment_still_works(): void
    {
        $doc = $this->createAndIssueDocument();

        $this->withHeaders($this->tenantHeaders())
            ->postJson('/api/payments', [
                'document_id' => $doc['id'],
                'amount' => 118000,
                'method' => 'cash',
                'paid_at' => '2026-08-20',
            ])
            ->assertCreated()
            ->assertJsonPath('source', 'manual')
            ->assertJsonPath('provider', 'manual');

        $this->assertDatabaseHas('documents', [
            'id' => $doc['id'],
            'status' => 'paid',
        ]);
    }

    public function test_portal_settings_hide_psp_api_key(): void
    {
        $this->organization->settings->update([
            'psp_api_key' => 'secret-should-not-leak',
            'psp_provider' => 'cinetpay',
        ]);

        $token = $this->issuedInvoiceToken();

        $this->getJson('/api/portal/'.$token)
            ->assertOk();

        $settings = $this->getJson('/api/portal/'.$token)->json('organization.settings');
        $this->assertArrayNotHasKey('psp_api_key', $settings);
        $this->assertArrayNotHasKey('psp_site_id', $settings);
        $this->assertArrayNotHasKey('reminders_enabled', $settings);
        $this->assertArrayHasKey('iban', $settings);
    }

    private function issuedInvoiceToken(): string
    {
        return $this->createAndIssueDocument([
            'online_payment_enabled' => true,
        ])['portal_token'];
    }

    private function documentIdFromToken(string $token): string
    {
        return Document::query()->where('portal_token', $token)->value('id');
    }
}

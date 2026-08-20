<?php

namespace Tests\Feature;

use App\Jobs\SendPaymentReceiptJob;
use App\Mail\DocumentSentMail;
use App\Models\Document;
use App\Models\Payment;
use App\Models\PaymentIntent;
use App\Services\Psp\CinetPayGateway;
use App\Services\Psp\FakePspGateway;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class CinetPayGatewayTest extends TestCase
{
    use CreatesTenant;
    use DatabaseTransactions;

    private FakePspGateway $gateway;

    protected function setUp(): void
    {
        parent::setUp();

        if ($this->app->make('db')->connection()->getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Requires PostgreSQL (native enums and row locks).');
        }

        Storage::fake('documents');
        Mail::fake();
        $this->seedTenant();
        $this->gateway = $this->app->make(FakePspGateway::class);
    }

    public function test_checkout_returns_a_checkout_url_from_the_gateway(): void
    {
        $token = $this->issuedInvoiceToken();

        $url = $this->postJson('/api/portal/'.$token.'/checkout', [
            'method_hint' => 'orange_money',
            'customer_phone' => '+221771234567',
        ])
            ->assertCreated()
            ->assertJsonPath('payment_intent.status', 'processing')
            ->json('payment_intent.checkout_url');

        $this->assertCount(1, $this->gateway->checkoutIntentIds);
        $this->assertStringStartsWith('https://checkout.cinetpay.test/pay/', $url);
    }

    public function test_portal_exposes_payment_status(): void
    {
        $token = $this->issuedInvoiceToken();

        $this->getJson('/api/portal/'.$token)
            ->assertOk()
            ->assertJsonPath('payment_status', 'unpaid');

        $this->postJson('/api/portal/'.$token.'/checkout')->assertCreated();

        $this->getJson('/api/portal/'.$token)
            ->assertOk()
            ->assertJsonPath('payment_status', 'processing');
    }

    public function test_webhook_invalid_signature_creates_no_payment(): void
    {
        $token = $this->issuedInvoiceToken();
        $intentId = $this->postJson('/api/portal/'.$token.'/checkout')->json('payment_intent.id');
        $this->gateway->signatureValid = false;

        $this->postJson('/api/webhooks/cinetpay', $this->webhookPayload($intentId))
            ->assertStatus(400);

        $this->assertSame(0, Payment::query()->count());
        Mail::assertNothingSent();
    }

    public function test_webhook_duplicate_creates_a_single_payment(): void
    {
        Bus::fake([SendPaymentReceiptJob::class]);

        $token = $this->issuedInvoiceToken();
        $intentId = $this->postJson('/api/portal/'.$token.'/checkout')->json('payment_intent.id');
        $payload = $this->webhookPayload($intentId, '118000');

        $this->post('/api/webhooks/cinetpay', $payload)->assertOk();
        $this->post('/api/webhooks/cinetpay', $payload)->assertOk();

        $this->assertSame(1, Payment::query()->where('provider_transaction_id', $intentId)->count());
        $this->assertDatabaseHas('documents', [
            'portal_token' => $token,
            'status' => 'paid',
        ]);
        Bus::assertDispatchedTimes(SendPaymentReceiptJob::class, 1);
    }

    public function test_webhook_tampered_amount_is_rejected(): void
    {
        $token = $this->issuedInvoiceToken();
        $intentId = $this->postJson('/api/portal/'.$token.'/checkout')->json('payment_intent.id');

        $this->post('/api/webhooks/cinetpay', $this->webhookPayload($intentId, '1'))
            ->assertStatus(422);

        $this->assertSame(0, Payment::query()->count());
        $this->assertDatabaseHas('documents', [
            'portal_token' => $token,
            'status' => 'sent',
        ]);
        Mail::assertNothingSent();
    }

    public function test_accepted_webhook_sends_receipt_mail(): void
    {
        $token = $this->issuedInvoiceToken();
        $intentId = $this->postJson('/api/portal/'.$token.'/checkout')->json('payment_intent.id');

        $this->post('/api/webhooks/cinetpay', $this->webhookPayload($intentId, '118000'))
            ->assertOk();

        Mail::assertSent(DocumentSentMail::class, function (DocumentSentMail $mail) {
            return $mail->hasTo($this->client->email)
                && str_contains($mail->envelope()->subject, 'Reçu');
        });
    }

    public function test_webhook_get_ping_is_ok(): void
    {
        $this->getJson('/api/webhooks/cinetpay')->assertOk();
    }

    public function test_receipt_pdf_is_conflict_without_payment(): void
    {
        $token = $this->issuedInvoiceToken();

        $this->getJson('/api/portal/'.$token.'/receipt.pdf')
            ->assertStatus(409)
            ->assertJsonPath('message', 'Aucun reçu disponible pour cette facture.');
    }

    public function test_receipt_pdf_streams_after_successful_webhook(): void
    {
        $token = $this->issuedInvoiceToken();
        $intentId = $this->postJson('/api/portal/'.$token.'/checkout')->json('payment_intent.id');

        $this->post('/api/webhooks/cinetpay', $this->webhookPayload($intentId, '118000'))
            ->assertOk();

        $this->get('/api/portal/'.$token.'/receipt.pdf')
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    }

    public function test_portal_exposes_failed_payment_status(): void
    {
        $this->gateway->fetchedStatus = 'REFUSED';
        $token = $this->issuedInvoiceToken();
        $intentId = $this->postJson('/api/portal/'.$token.'/checkout')->json('payment_intent.id');

        $this->post('/api/webhooks/cinetpay', $this->webhookPayload($intentId, '118000'))
            ->assertOk();

        $this->getJson('/api/portal/'.$token)
            ->assertOk()
            ->assertJsonPath('payment_status', 'failed');

        $this->assertSame(0, Payment::query()->count());
    }

    public function test_cinetpay_hmac_token_matches_documented_concatenation(): void
    {
        config(['services.cinetpay.secret_key' => 'test-secret']);

        $payload = [
            'cpm_site_id' => 'site',
            'cpm_trans_id' => 'tx-1',
            'cpm_trans_date' => '2026-08-20 10:00:00',
            'cpm_amount' => '118000',
            'cpm_currency' => 'XOF',
            'signature' => 'sig',
            'payment_method' => 'OM',
            'cel_phone_num' => '771234567',
            'cpm_phone_prefixe' => '221',
            'cpm_language' => 'fr',
            'cpm_version' => 'V4',
            'cpm_payment_config' => 'SINGLE',
            'cpm_page_action' => 'PAYMENT',
            'cpm_custom' => 'intent-1',
            'cpm_designation' => 'Facture',
            'cpm_error_message' => '',
        ];

        $gateway = $this->app->make(CinetPayGateway::class);
        $token = $gateway->hmacToken($payload);

        $this->assertTrue(hash_equals(
            hash_hmac('sha256', implode('', array_map(
                fn (string $field) => $payload[$field],
                CinetPayGateway::HMAC_FIELDS,
            )), 'test-secret'),
            $token,
        ));

        $request = Request::create('/api/webhooks/cinetpay', 'POST', $payload);
        $request->headers->set('x-token', $token);
        $this->assertTrue($gateway->verifySignature($request));

        $request->headers->set('x-token', 'nope');
        $this->assertFalse($gateway->verifySignature($request));
    }

    public function test_cinetpay_create_checkout_posts_to_the_payment_api(): void
    {
        config([
            'services.cinetpay.api_key' => 'api',
            'services.cinetpay.site_id' => 'site',
            'services.cinetpay.secret_key' => 'secret',
        ]);

        Http::fake([
            'https://api-checkout.cinetpay.com/v2/payment' => Http::response([
                'code' => '201',
                'message' => 'CREATED',
                'data' => [
                    'payment_token' => 'tok',
                    'payment_url' => 'https://checkout.cinetpay.com/live/abc',
                ],
            ], 200),
        ]);

        $token = $this->issuedInvoiceToken();
        $intentId = $this->postJson('/api/portal/'.$token.'/checkout')->json('payment_intent.id');
        $intent = PaymentIntent::query()->findOrFail($intentId);
        $document = Document::query()->findOrFail($intent->document_id);

        $result = $this->app->make(CinetPayGateway::class)->createCheckout($intent, $document);

        $this->assertSame('https://checkout.cinetpay.com/live/abc', $result->checkoutUrl);
        Http::assertSent(function ($request) use ($intent) {
            return $request->url() === 'https://api-checkout.cinetpay.com/v2/payment'
                && $request['transaction_id'] === $intent->id
                && $request['amount'] === 118000
                && $request['currency'] === 'XOF';
        });
    }

    /**
     * @return array<string, string>
     */
    private function webhookPayload(string $intentId, string $amount = '118000'): array
    {
        return [
            'cpm_site_id' => 'site',
            'cpm_trans_id' => $intentId,
            'cpm_trans_date' => '2026-08-20 10:00:00',
            'cpm_amount' => $amount,
            'cpm_currency' => 'XOF',
            'cpm_custom' => $intentId,
            'cpm_designation' => 'Facture',
        ];
    }

    private function issuedInvoiceToken(): string
    {
        return $this->createAndIssueDocument([
            'online_payment_enabled' => true,
        ])['portal_token'];
    }
}

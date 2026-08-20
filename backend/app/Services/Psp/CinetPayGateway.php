<?php

namespace App\Services\Psp;

use App\Contracts\PspGateway;
use App\Exceptions\PspCheckoutException;
use App\Models\Document;
use App\Models\PaymentIntent;
use App\Models\Plan;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class CinetPayGateway implements PspGateway
{
    public const HMAC_FIELDS = [
        'cpm_site_id',
        'cpm_trans_id',
        'cpm_trans_date',
        'cpm_amount',
        'cpm_currency',
        'signature',
        'payment_method',
        'cel_phone_num',
        'cpm_phone_prefixe',
        'cpm_language',
        'cpm_version',
        'cpm_payment_config',
        'cpm_page_action',
        'cpm_custom',
        'cpm_designation',
        'cpm_error_message',
    ];

    private const INIT_URL = 'https://api-checkout.cinetpay.com/v2/payment';

    private const CHECK_URL = 'https://api-checkout.cinetpay.com/v2/payment/check';

    public function createCheckout(PaymentIntent $intent, ?Document $doc = null): PspCheckoutResult
    {
        if ($intent->purpose === PaymentIntent::PURPOSE_SAAS_PLAN) {
            return $this->createSaasCheckout($intent);
        }

        if (! $doc) {
            throw new PspCheckoutException('Document requis pour le checkout facture.');
        }

        $doc->loadMissing(['client', 'organization.settings']);
        $snapshot = $doc->snapshot_json ?? [];
        $client = $snapshot['client'] ?? [];
        $org = $snapshot['organization'] ?? [];

        $payload = [
            'apikey' => $this->apiKey(),
            'site_id' => $this->siteId(),
            'transaction_id' => $intent->id,
            'amount' => (int) bcadd((string) $intent->amount, '0', 0),
            'currency' => $intent->currency ?: 'XOF',
            'description' => 'Facture '.($doc->number ?: $intent->id),
            'notify_url' => $this->notifyUrl(),
            'return_url' => $this->returnUrl($doc),
            'channels' => $this->channels($intent->method_hint),
            'lang' => 'fr',
            'metadata' => $intent->id,
            'customer_id' => (string) ($client['id'] ?? $doc->client_id ?? ''),
            'customer_name' => (string) ($client['name'] ?? $doc->client_name ?? 'Client'),
            'customer_surname' => (string) ($client['name'] ?? $doc->client_name ?? 'Client'),
            'customer_email' => (string) ($client['email'] ?? $doc->client?->email ?? 'noreply@invomind.com'),
            'customer_phone_number' => $this->phone($intent->customer_phone ?? $client['phone'] ?? null),
            'customer_address' => (string) ($client['address'] ?? $org['address'] ?? 'Dakar'),
            'customer_city' => (string) ($client['city'] ?? $org['city'] ?? 'Dakar'),
            'customer_country' => $this->country($client['country'] ?? $org['country'] ?? 'SN'),
            'customer_state' => (string) ($client['city'] ?? $org['city'] ?? 'Dakar'),
            'customer_zip_code' => (string) ($client['postal_code'] ?? '00000'),
        ];

        return $this->initPayment($payload, $intent->id);
    }

    private function createSaasCheckout(PaymentIntent $intent): PspCheckoutResult
    {
        $plan = Plan::find($intent->plan_id);
        $planName = $plan?->name ?? (string) $intent->plan_id;
        $frontend = rtrim((string) config('services.frontend.url'), '/');

        $payload = [
            'apikey' => $this->apiKey(),
            'site_id' => $this->siteId(),
            'transaction_id' => $intent->id,
            'amount' => (int) bcadd((string) $intent->amount, '0', 0),
            'currency' => $intent->currency ?: 'XOF',
            'description' => 'Abonnement InvoMind '.$planName,
            'notify_url' => $this->notifyUrl(),
            'return_url' => $frontend.'/billing?paid=1',
            'channels' => $this->channels($intent->method_hint),
            'lang' => 'fr',
            'metadata' => $intent->id,
            'customer_id' => $intent->organization_id,
            'customer_name' => 'InvoMind',
            'customer_surname' => 'SaaS',
            'customer_email' => 'billing@invomind.com',
            'customer_phone_number' => $this->phone($intent->customer_phone),
            'customer_address' => 'Dakar',
            'customer_city' => 'Dakar',
            'customer_country' => 'SN',
            'customer_state' => 'Dakar',
            'customer_zip_code' => '00000',
        ];

        return $this->initPayment($payload, $intent->id);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function initPayment(array $payload, string $intentId): PspCheckoutResult
    {
        try {
            $response = Http::acceptJson()
                ->asJson()
                ->timeout(20)
                ->post(self::INIT_URL, $payload)
                ->throw();
        } catch (RequestException $e) {
            throw new PspCheckoutException(
                'CinetPay a refusé l’initialisation du paiement.',
            );
        }

        $code = (string) $response->json('code');
        $url = $response->json('data.payment_url');

        if (! in_array($code, ['201', '00'], true) || ! is_string($url) || $url === '') {
            throw new PspCheckoutException(
                (string) ($response->json('message') ?: 'CinetPay n’a pas renvoyé d’URL de paiement.'),
            );
        }

        return new PspCheckoutResult(
            checkoutUrl: $url,
            providerTransactionId: $intentId,
            raw: $response->json() ?? [],
        );
    }

    public function verifySignature(Request $request): bool
    {
        $secret = (string) config('services.cinetpay.secret_key');
        $received = (string) $request->header('x-token', '');

        if ($secret === '' || $received === '') {
            return false;
        }

        return hash_equals($this->hmacToken($request->all()), $received);
    }

    public function parseWebhook(Request $request): PspWebhookEvent
    {
        $transactionId = (string) $request->input('cpm_trans_id', '');
        $custom = $request->input('cpm_custom');

        return new PspWebhookEvent(
            transactionId: $transactionId,
            amount: (string) $request->input('cpm_amount', '0'),
            currency: (string) $request->input('cpm_currency', 'XOF'),
            payload: $request->all(),
            intentId: is_string($custom) && $custom !== '' ? $custom : $transactionId,
        );
    }

    public function fetchTransaction(string $providerTransactionId): PspTransaction
    {
        $response = Http::acceptJson()
            ->asJson()
            ->timeout(20)
            ->post(self::CHECK_URL, [
                'apikey' => $this->apiKey(),
                'site_id' => $this->siteId(),
                'transaction_id' => $providerTransactionId,
            ]);

        $status = strtoupper((string) ($response->json('data.status') ?? 'REFUSED'));
        $amount = (string) ($response->json('data.amount') ?? '0');
        $currency = (string) ($response->json('data.currency') ?? 'XOF');

        return new PspTransaction(
            transactionId: $providerTransactionId,
            amount: $amount,
            currency: $currency,
            status: $status,
            raw: $response->json() ?? [],
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function hmacToken(array $payload): string
    {
        $data = '';
        foreach (self::HMAC_FIELDS as $field) {
            $data .= (string) ($payload[$field] ?? '');
        }

        return hash_hmac('sha256', $data, (string) config('services.cinetpay.secret_key'));
    }

    private function apiKey(): string
    {
        return (string) config('services.cinetpay.api_key');
    }

    private function siteId(): string
    {
        return (string) config('services.cinetpay.site_id');
    }

    private function notifyUrl(): string
    {
        $configured = (string) config('services.cinetpay.notify_url');

        return $configured !== '' ? $configured : url('/api/webhooks/cinetpay');
    }

    private function returnUrl(Document $doc): string
    {
        $template = (string) config('services.cinetpay.return_url');
        if ($template !== '') {
            return str_replace('{token}', $doc->portal_token, $template);
        }

        return rtrim((string) config('services.frontend.url'), '/').'/f/'.$doc->portal_token.'?paid=1';
    }

    private function channels(?string $methodHint): string
    {
        return match ($methodHint) {
            'card' => 'CREDIT_CARD',
            'wave', 'orange_money', 'mtn', 'moov' => 'MOBILE_MONEY',
            default => 'ALL',
        };
    }

    private function phone(?string $phone): string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone) ?? '';

        return $digits !== '' ? $digits : '2250770000000';
    }

    private function country(string $country): string
    {
        $code = strtoupper(substr($country, 0, 2));

        return $code !== '' ? $code : 'CI';
    }
}

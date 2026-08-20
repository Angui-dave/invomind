<?php

namespace App\Services;

use App\Models\DeliveryAttempt;
use App\Models\WebhookConfig;
use App\Support\SafeOutboundUrl;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebhookService
{
    public function send(string $organizationId, array $payload): array
    {
        $config = WebhookConfig::find($organizationId);

        if (! $config || ! $config->enabled || empty($config->url)) {
            DeliveryAttempt::create([
                'organization_id' => $organizationId,
                'conversation_id' => $payload['conversationId'] ?? '',
                'channel' => $payload['channel'] ?? 'whatsapp',
                'status' => 'skipped',
            ]);

            return ['status' => 'skipped'];
        }

        if (! SafeOutboundUrl::isAllowed($config->url)) {
            DeliveryAttempt::create([
                'organization_id' => $organizationId,
                'conversation_id' => $payload['conversationId'] ?? '',
                'channel' => $payload['channel'] ?? 'whatsapp',
                'status' => 'failed',
                'error' => 'Webhook URL rejected (SSRF policy)',
            ]);

            return ['status' => 'failed', 'error' => 'Webhook URL rejected'];
        }

        $body = json_encode($payload);
        $signature = hash_hmac('sha256', $body, $config->secret);
        $start = microtime(true);

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-Signature' => $signature,
            ])->timeout(10)->withOptions([
                'allow_redirects' => false,
            ])->post($config->url, $payload);

            $durationMs = (int) ((microtime(true) - $start) * 1000);
            $status = $response->successful() ? 'success' : 'failed';

            DeliveryAttempt::create([
                'organization_id' => $organizationId,
                'conversation_id' => $payload['conversationId'] ?? '',
                'channel' => $payload['channel'] ?? 'whatsapp',
                'status' => $status,
                'http_status' => $response->status(),
                'duration_ms' => $durationMs,
            ]);

            return ['status' => $status, 'http_status' => $response->status()];
        } catch (\Throwable $e) {
            $durationMs = (int) ((microtime(true) - $start) * 1000);
            Log::error('Webhook delivery failed', ['error' => $e->getMessage()]);

            DeliveryAttempt::create([
                'organization_id' => $organizationId,
                'conversation_id' => $payload['conversationId'] ?? '',
                'channel' => $payload['channel'] ?? 'whatsapp',
                'status' => 'failed',
                'error' => $e->getMessage(),
                'duration_ms' => $durationMs,
            ]);

            return ['status' => 'failed', 'error' => $e->getMessage()];
        }
    }

    public function verifyMetaSignature(string $payload, string $signature, ?string $appSecret): bool
    {
        if ($appSecret === null || $appSecret === '' || $signature === '') {
            return false;
        }

        $expected = 'sha256='.hash_hmac('sha256', $payload, $appSecret);

        return hash_equals($expected, $signature);
    }

    public function verifyTiktokSignature(string $payload, string $signature, ?string $clientSecret): bool
    {
        if ($clientSecret === null || $clientSecret === '' || $signature === '') {
            return false;
        }

        $expected = hash_hmac('sha256', $payload, $clientSecret);

        return hash_equals($expected, $signature);
    }
}

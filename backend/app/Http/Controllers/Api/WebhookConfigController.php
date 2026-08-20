<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryAttempt;
use App\Models\WebhookConfig;
use App\Support\SafeOutboundUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class WebhookConfigController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $orgId = $this->orgId($request);
        $config = WebhookConfig::find($orgId);

        return response()->json([
            'config' => $this->publicConfig($config),
            'deliveries' => DeliveryAttempt::where('organization_id', $orgId)
                ->orderBy('attempted_at', 'desc')
                ->limit(20)
                ->get(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'url' => ['sometimes', 'nullable', 'string'],
            'enabled' => ['sometimes', 'boolean'],
            'secret' => ['nullable', 'string'],
        ]);

        $orgId = $this->orgId($request);
        $existing = WebhookConfig::find($orgId);

        $url = array_key_exists('url', $data)
            ? trim((string) ($data['url'] ?? ''))
            : ($existing?->url ?? '');

        $enabled = array_key_exists('enabled', $data)
            ? (bool) $data['enabled']
            : (bool) ($existing?->enabled ?? false);

        if ($url !== '' && ! SafeOutboundUrl::isAllowed($url)) {
            throw ValidationException::withMessages([
                'url' => ['L’URL du webhook doit être HTTPS et pointer vers un hôte public.'],
            ]);
        }

        if ($url === '' && $enabled) {
            $enabled = false;
        }

        $attributes = [
            'url' => $url,
            'enabled' => $enabled,
        ];

        if (array_key_exists('secret', $data) && $data['secret'] !== null && $data['secret'] !== '') {
            $attributes['secret'] = $data['secret'];
        }

        $config = WebhookConfig::updateOrCreate(
            ['organization_id' => $orgId],
            $attributes
        );

        return response()->json([
            'config' => $this->publicConfig($config),
            'deliveries' => DeliveryAttempt::where('organization_id', $orgId)
                ->orderBy('attempted_at', 'desc')
                ->limit(20)
                ->get(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function publicConfig(?WebhookConfig $config): array
    {
        $url = $config?->url ?? '';
        $hasSecret = $config && ! empty($config->secret);

        return [
            'url' => $url,
            'url_masked' => $url !== '' ? $this->maskUrl($url) : '',
            'enabled' => $config?->enabled ?? false,
            'has_secret' => $hasSecret,
            'hasSecret' => $hasSecret,
            'secret_masked' => $hasSecret ? '••••••••' : '',
            'secretMasked' => $hasSecret ? '••••••••' : '',
            'meta_verify_configured' => filled(config('services.meta.verify_token')),
            'metaVerifyConfigured' => filled(config('services.meta.verify_token')),
            'meta_app_secret_configured' => filled(config('services.meta.app_secret')),
            'metaAppSecretConfigured' => filled(config('services.meta.app_secret')),
            'tiktok_secret_configured' => filled(config('services.tiktok.client_secret')),
            'tiktokSecretConfigured' => filled(config('services.tiktok.client_secret')),
        ];
    }

    private function maskUrl(string $url): string
    {
        if (strlen($url) <= 40) {
            return $url;
        }

        return substr($url, 0, 30).'…'.substr($url, -8);
    }
}

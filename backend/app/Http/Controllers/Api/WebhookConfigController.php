<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryAttempt;
use App\Models\WebhookConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WebhookConfigController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $orgId = $this->orgId($request);
        $config = WebhookConfig::find($orgId);

        $maskedUrl = $config && $config->url
            ? substr($config->url, 0, 30) . '...'
            : '';

        $deliveries = DeliveryAttempt::where('organization_id', $orgId)
            ->orderBy('attempted_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'config' => [
                'url' => $maskedUrl,
                'enabled' => $config?->enabled ?? false,
                'has_secret' => $config && ! empty($config->secret),
            ],
            'deliveries' => $deliveries,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'url' => ['required', 'url'],
            'enabled' => ['required', 'boolean'],
            'secret' => ['nullable', 'string'],
        ]);

        $orgId = $this->orgId($request);

        $config = WebhookConfig::updateOrCreate(
            ['organization_id' => $orgId],
            [
                'url' => $data['url'],
                'enabled' => $data['enabled'],
                'secret' => $data['secret'] ?? '',
            ]
        );

        return response()->json($config);
    }
}

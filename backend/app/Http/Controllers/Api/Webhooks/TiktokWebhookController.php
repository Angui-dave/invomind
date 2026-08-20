<?php

namespace App\Http\Controllers\Api\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\ChannelConnection;
use App\Models\InboundMessage;
use App\Services\WebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TiktokWebhookController extends Controller
{
    public function handle(Request $request, WebhookService $webhook): JsonResponse
    {
        $signature = $request->header('tiktok-signature', '');
        $payload = $request->getContent();

        if (! $webhook->verifyTiktokSignature($payload, $signature, config('services.tiktok.client_secret'))) {
            return response()->json(['error' => 'Invalid signature'], 403);
        }

        $body = $request->all();
        $clientKey = $body['client_key'] ?? '';

        if ($clientKey !== config('services.tiktok.client_key')) {
            return response()->json(['error' => 'Invalid client key'], 403);
        }

        $connection = ChannelConnection::where('channel', 'tiktok')
            ->where('external_id', $clientKey)
            ->first();

        if (! $connection) {
            return response()->json(['error' => 'Unknown tenant'], 404);
        }

        foreach ($body['data'] ?? [] as $msg) {
            InboundMessage::create([
                'id' => $msg['message_id'] ?? uniqid('tt_'),
                'organization_id' => $connection->organization_id,
                'channel' => 'tiktok',
                'handle' => $msg['sender']['open_id'] ?? '',
                'body' => $msg['content']['text'] ?? '',
                'sent_at' => now()->toIso8601String(),
                'contact_name' => $msg['sender']['display_name'] ?? null,
            ]);
        }

        return response()->json(['status' => 'ok']);
    }
}

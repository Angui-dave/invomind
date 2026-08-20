<?php

namespace App\Http\Controllers\Api\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\ChannelConnection;
use App\Services\InboundConversationService;
use App\Services\WebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TiktokWebhookController extends Controller
{
    public function handle(
        Request $request,
        WebhookService $webhook,
        InboundConversationService $inbound,
    ): JsonResponse {
        $signature = $request->header('tiktok-signature', '');
        $payload = $request->getContent();

        if (! $webhook->verifyTiktokSignature($payload, $signature, config('services.tiktok.client_secret'))) {
            return response()->json(['error' => 'Invalid signature'], 403);
        }

        $body = $request->all();
        $clientKey = $body['client_key'] ?? '';
        $configuredKey = (string) config('services.tiktok.client_key');

        if ($configuredKey === '' || $clientKey !== $configuredKey) {
            return response()->json(['error' => 'Invalid client key'], 403);
        }

        $connection = ChannelConnection::where('channel', 'tiktok')
            ->where('external_id', $clientKey)
            ->first();

        if (! $connection) {
            return response()->json(['error' => 'Unknown tenant'], 404);
        }

        foreach ($body['data'] ?? [] as $msg) {
            $messageId = $msg['message_id'] ?? null;
            if (! is_string($messageId) || $messageId === '') {
                continue;
            }

            $handle = (string) ($msg['sender']['open_id'] ?? '');
            $threadRef = isset($msg['conversation_id']) ? (string) $msg['conversation_id'] : null;

            $inbound->ingest(
                $connection->organization_id,
                'tiktok',
                $handle,
                (string) ($msg['content']['text'] ?? ''),
                isset($msg['sender']['display_name']) ? (string) $msg['sender']['display_name'] : null,
                $messageId,
                now()->toIso8601String(),
                $threadRef,
            );
        }

        return response()->json(['status' => 'ok']);
    }
}

<?php

namespace App\Http\Controllers\Api\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\ChannelConnection;
use App\Services\InboundConversationService;
use App\Services\WebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class MetaWebhookController extends Controller
{
    public function verify(Request $request): Response
    {
        $mode = $request->query('hub.mode') ?? $request->query('hub_mode');
        $token = $request->query('hub.verify_token') ?? $request->query('hub_verify_token');
        $challenge = $request->query('hub.challenge') ?? $request->query('hub_challenge');

        $verifyToken = (string) config('services.meta.verify_token');
        if ($verifyToken === '' || $mode !== 'subscribe' || $token !== $verifyToken) {
            return response('Forbidden', 403);
        }

        return response((string) $challenge, 200)->header('Content-Type', 'text/plain');
    }

    public function handle(
        Request $request,
        WebhookService $webhook,
        InboundConversationService $inbound,
    ): JsonResponse {
        $signature = $request->header('x-hub-signature-256', '');
        $payload = $request->getContent();

        if (! $webhook->verifyMetaSignature($payload, $signature, config('services.meta.app_secret'))) {
            return response()->json(['error' => 'Invalid signature'], 403);
        }

        $body = $request->all();

        foreach ($body['entry'] ?? [] as $entry) {
            foreach ($entry['messaging'] ?? $entry['changes'] ?? [] as $event) {
                $senderId = $event['sender']['id'] ?? $event['value']['from'] ?? null;
                if (! $senderId) {
                    continue;
                }

                $messageId = $event['message']['mid'] ?? $event['value']['id'] ?? null;
                if (! is_string($messageId) || $messageId === '') {
                    continue;
                }

                $channel = $this->resolveChannel($entry);
                $connection = ChannelConnection::where('channel', $channel)
                    ->where('external_id', $entry['id'] ?? '')
                    ->first();

                if (! $connection) {
                    continue;
                }

                $messageBody = $event['message']['text'] ?? $event['value']['text']['body'] ?? '';

                $inbound->ingest(
                    $connection->organization_id,
                    $channel,
                    (string) $senderId,
                    (string) $messageBody,
                    isset($event['sender']['name']) ? (string) $event['sender']['name'] : null,
                    $messageId,
                    now()->toIso8601String(),
                );
            }
        }

        return response()->json(['status' => 'ok']);
    }

    private function resolveChannel(array $entry): string
    {
        if (isset($entry['changes'][0]['field']) && $entry['changes'][0]['field'] === 'messages') {
            return 'whatsapp';
        }

        return 'messenger';
    }
}

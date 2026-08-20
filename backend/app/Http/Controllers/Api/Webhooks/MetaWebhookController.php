<?php

namespace App\Http\Controllers\Api\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\ChannelConnection;
use App\Models\InboundMessage;
use App\Services\WebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class MetaWebhookController extends Controller
{
    public function verify(Request $request): Response
    {
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        if ($mode === 'subscribe' && $token === config('services.meta.verify_token')) {
            return response($challenge, 200);
        }

        return response('Forbidden', 403);
    }

    public function handle(Request $request, WebhookService $webhook): JsonResponse
    {
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

                $channel = $this->resolveChannel($entry);
                $connection = ChannelConnection::where('channel', $channel)
                    ->where('external_id', $entry['id'] ?? '')
                    ->first();

                if (! $connection) {
                    continue;
                }

                $messageBody = $event['message']['text'] ?? $event['value']['text']['body'] ?? '';

                InboundMessage::create([
                    'id' => $event['message']['mid'] ?? $event['value']['id'] ?? uniqid('meta_'),
                    'organization_id' => $connection->organization_id,
                    'channel' => $channel,
                    'handle' => $senderId,
                    'body' => $messageBody,
                    'sent_at' => now()->toIso8601String(),
                    'contact_name' => $event['sender']['name'] ?? null,
                ]);
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

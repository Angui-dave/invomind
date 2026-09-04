<?php

namespace App\Http\Controllers\Api\Webhooks;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessInboundWebhookJob;
use App\Services\Messagerie\CanalAdapterFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class MetaWebhookController extends Controller
{
    public function verify(Request $request): Response|JsonResponse
    {
        $mode = $request->query('hub_mode', $request->query('hub.mode'));
        $token = $request->query('hub_verify_token', $request->query('hub.verify_token'));
        $challenge = $request->query('hub_challenge', $request->query('hub.challenge'));

        $expected = (string) config('services.meta.verify_token', '');

        if ($mode === 'subscribe' && $expected !== '' && hash_equals($expected, (string) $token)) {
            return response((string) $challenge, 200)->header('Content-Type', 'text/plain');
        }

        return response()->json(['message' => 'Forbidden'], 403);
    }

    public function handle(Request $request, CanalAdapterFactory $factory): JsonResponse
    {
        $adapter = $factory->metaSignatureAdapter();
        if (! $adapter->verifierSignatureWebhook($request)) {
            return response()->json(['message' => 'Invalid signature'], 403);
        }

        $object = (string) $request->input('object', '');
        $canal = match ($object) {
            'whatsapp_business_account' => 'whatsapp',
            'page' => 'messenger',
            'instagram' => 'instagram',
            default => null,
        };

        // Instagram sometimes arrives under object=page with messaging; dispatch both parsers via messenger+instagram jobs when object=page
        if ($canal === null) {
            return response()->json(['status' => 'ignored']);
        }

        $headers = [
            'X-Hub-Signature-256' => (string) $request->header('X-Hub-Signature-256', ''),
        ];

        ProcessInboundWebhookJob::dispatch($canal, $request->all(), $headers, $request->getContent());

        return response()->json(['status' => 'ok']);
    }
}

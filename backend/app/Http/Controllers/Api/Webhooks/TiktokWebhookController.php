<?php

namespace App\Http\Controllers\Api\Webhooks;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessInboundWebhookJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TiktokWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        if (! config('messagerie.tiktok.enabled')) {
            return response()->json([
                'status' => 'disabled',
                'message' => 'TikTok Business Messaging n’est pas encore activé.',
            ]);
        }

        ProcessInboundWebhookJob::dispatch(
            'tiktok',
            $request->all(),
            [
                'TikTok-Signature' => (string) $request->header('TikTok-Signature', ''),
            ],
            $request->getContent(),
        );

        return response()->json(['status' => 'ok']);
    }
}

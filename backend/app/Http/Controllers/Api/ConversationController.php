<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ConversationSendRequest;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\InboundMessage;
use App\Services\EntitlementService;
use App\Services\WebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ConversationController extends Controller
{
    public function index(Request $request, EntitlementService $entitlements): AnonymousResourceCollection|\Illuminate\Http\JsonResponse
    {
        $entitlements->assertModule($this->orgId($request), 'conversations');

        $query = Conversation::where('organization_id', $this->orgId($request))
            ->orderBy('last_message_at', 'desc');

        return $this->paginated($request, $query, ConversationResource::class);
    }

    public function messages(Request $request, EntitlementService $entitlements): JsonResponse
    {
        $entitlements->assertModule($this->orgId($request), 'conversations');

        $query = ConversationMessage::where('organization_id', $this->orgId($request));

        if ($request->filled('conversation_id')) {
            $query->where('conversation_id', $request->query('conversation_id'));
        }

        $messages = $query->orderBy('sent_at')->get();

        return response()->json($messages);
    }

    public function send(ConversationSendRequest $request, WebhookService $webhook, EntitlementService $entitlements): JsonResponse
    {
        $entitlements->assertModule($this->orgId($request), 'conversations');

        $data = $request->validated();
        $orgId = $this->orgId($request);

        $conversation = Conversation::where('organization_id', $orgId)
            ->findOrFail($data['conversation_id']);

        $message = ConversationMessage::create([
            'organization_id' => $orgId,
            'conversation_id' => $conversation->id,
            'direction' => 'outbound',
            'body' => $data['body'],
            'status' => 'pending',
        ]);

        $result = $webhook->send($orgId, [
            'conversationId' => $conversation->id,
            'channel' => $data['channel'],
            'to' => $data['to'],
            'body' => $data['body'],
            'threadRef' => $data['thread_ref'] ?? null,
        ]);

        $message->update(['status' => $result['status'] === 'success' ? 'sent' : $result['status']]);

        $conversation->update(['last_message_at' => now()]);

        return response()->json([
            'message' => $message,
            'delivery' => $result,
        ]);
    }

    public function inbox(Request $request, EntitlementService $entitlements): JsonResponse
    {
        $entitlements->assertModule($this->orgId($request), 'conversations');

        $since = $request->query('since');
        $orgId = $this->orgId($request);

        $query = InboundMessage::where('organization_id', $orgId);

        if ($since) {
            $query->where('sent_at', '>', $since);
        }

        return response()->json(['messages' => $query->orderBy('sent_at')->get()]);
    }
}

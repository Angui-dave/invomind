<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ConversationSendRequest;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\InboundMessage;
use App\Services\WebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $conversations = Conversation::where('organization_id', $this->orgId($request))
            ->orderBy('last_message_at', 'desc')
            ->get();

        return response()->json($conversations);
    }

    public function messages(Request $request): JsonResponse
    {
        $messages = ConversationMessage::where('organization_id', $this->orgId($request))
            ->orderBy('sent_at')
            ->get();

        return response()->json($messages);
    }

    public function send(ConversationSendRequest $request, WebhookService $webhook): JsonResponse
    {
        $data = $request->validated();
        $orgId = $this->orgId($request);

        $message = ConversationMessage::create([
            'organization_id' => $orgId,
            'conversation_id' => $data['conversation_id'],
            'direction' => 'outbound',
            'body' => $data['body'],
            'status' => 'pending',
        ]);

        $result = $webhook->send($orgId, [
            'conversationId' => $data['conversation_id'],
            'channel' => $data['channel'],
            'to' => $data['to'],
            'body' => $data['body'],
            'threadRef' => $data['thread_ref'] ?? null,
        ]);

        $message->update(['status' => $result['status'] === 'success' ? 'sent' : $result['status']]);

        Conversation::where('id', $data['conversation_id'])
            ->update(['last_message_at' => now()]);

        return response()->json([
            'message' => $message,
            'delivery' => $result,
        ]);
    }

    public function inbox(Request $request): JsonResponse
    {
        $since = $request->query('since');
        $orgId = $this->orgId($request);

        $query = InboundMessage::where('organization_id', $orgId);

        if ($since) {
            $query->where('created_at', '>', $since);
        }

        return response()->json(['messages' => $query->orderBy('created_at')->get()]);
    }
}

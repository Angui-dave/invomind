<?php

namespace App\Http\Controllers\Api;

use App\Enums\DirectionMessage;
use App\Enums\StatutConversation;
use App\Enums\StatutLivraisonMessage;
use App\Enums\TypeContenuMessage;
use App\Events\ConversationMiseAJour;
use App\Http\Controllers\Controller;
use App\Http\Requests\ConversationAssignRequest;
use App\Http\Requests\ConversationSendMessageRequest;
use App\Http\Requests\ConversationStatusRequest;
use App\Http\Resources\ConversationMessageResource;
use App\Http\Resources\ConversationResource;
use App\Jobs\SendConversationMessageJob;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\Label;
use App\Models\User;
use App\Services\EntitlementService;
use App\Services\Messagerie\FenetreReponseService;
use App\Support\OrgRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ConversationController extends Controller
{
    public function __construct(
        private EntitlementService $entitlements,
        private FenetreReponseService $fenetre,
    ) {}

    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        $query = Conversation::query()
            ->with(['inbox', 'contact.inboxLinks', 'agent', 'labels', 'messages' => fn ($q) => $q->latest('envoye_at')->limit(1)])
            ->orderByDesc('derniere_activite_at');

        if ($request->filled('statut')) {
            $query->where('statut', $request->query('statut'));
        }
        if ($request->filled('agent_id')) {
            $query->where('agent_id', $request->query('agent_id'));
        }
        if ($request->filled('canal')) {
            $query->whereHas('inbox', fn ($q) => $q->where('canal', $request->query('canal')));
        }
        if ($request->boolean('archivee') === false && ! $request->has('archivee')) {
            $query->where('archivee', false);
        } elseif ($request->has('archivee')) {
            $query->where('archivee', $request->boolean('archivee'));
        }

        return $this->paginated($request, $query, ConversationResource::class);
    }

    public function show(Request $request, int $id): ConversationResource
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        $conversation = Conversation::query()
            ->with(['inbox', 'contact.client', 'contact.inboxLinks', 'agent', 'labels'])
            ->findOrFail($id);

        return new ConversationResource($conversation);
    }

    public function messages(Request $request, int $id): AnonymousResourceCollection|JsonResponse
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        Conversation::query()->findOrFail($id);

        $query = ConversationMessage::query()
            ->where('conversation_id', $id)
            ->orderBy('envoye_at');

        return $this->paginated($request, $query, ConversationMessageResource::class);
    }

    public function messagesBatch(Request $request): JsonResponse
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        $ids = $request->query('ids', []);
        if (is_string($ids)) {
            $ids = array_filter(array_map('intval', explode(',', $ids)));
        }
        if (! is_array($ids) || $ids === []) {
            return response()->json(['data' => []]);
        }

        $ids = array_values(array_unique(array_map('intval', $ids)));
        $owned = Conversation::query()->whereIn('id', $ids)->pluck('id')->all();

        $messages = ConversationMessage::query()
            ->whereIn('conversation_id', $owned)
            ->orderBy('envoye_at')
            ->get();

        return response()->json([
            'data' => ConversationMessageResource::collection($messages)->resolve(),
        ]);
    }

    public function sendMessage(ConversationSendMessageRequest $request, int $id): ConversationMessageResource
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        $conversation = Conversation::query()->with('inbox')->findOrFail($id);
        $type = TypeContenuMessage::tryFrom((string) $request->input('type_contenu', 'texte'))
            ?? TypeContenuMessage::Texte;
        $this->fenetre->assertOuverte($conversation, $type);

        $contenu = (string) $request->input('contenu', '');
        if ($type === TypeContenuMessage::Modele) {
            $decoded = json_decode($contenu, true);
            if (! is_array($decoded) || empty($decoded['name'])) {
                abort(422, 'Pour un modèle, contenu doit être un JSON { name, language, components? }.');
            }
        } elseif ($type === TypeContenuMessage::Texte && trim($contenu) === '') {
            abort(422, 'Le contenu du message est requis.');
        }

        $message = ConversationMessage::query()->create([
            'conversation_id' => $conversation->id,
            'boite_reception_id' => $conversation->boite_reception_id,
            'direction' => DirectionMessage::Sortant,
            'type_contenu' => $type,
            'contenu' => $contenu,
            'url_media' => $request->input('url_media'),
            'statut_livraison' => StatutLivraisonMessage::EnAttente,
            'expediteur_agent_id' => $request->user()?->id,
            'envoye_at' => now(),
        ]);

        $conversation->update([
            'derniere_activite_at' => now(),
            'statut' => StatutConversation::Ouverte,
        ]);

        SendConversationMessageJob::dispatch($message->id);

        return new ConversationMessageResource($message);
    }

    public function updateStatus(ConversationStatusRequest $request, int $id): ConversationResource
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        $conversation = Conversation::query()->findOrFail($id);
        $conversation->update([
            'statut' => $request->input('statut'),
        ]);

        event(new ConversationMiseAJour($conversation->fresh(['inbox', 'contact', 'agent', 'labels'])));

        return new ConversationResource($conversation->fresh(['inbox', 'contact', 'agent', 'labels']));
    }

    public function assign(ConversationAssignRequest $request, int $id): ConversationResource
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        $conversation = Conversation::query()->findOrFail($id);
        $agentId = $request->input('agent_id');

        if ($agentId !== null) {
            $agent = User::query()
                ->where('id', $agentId)
                ->where('orga_id', $this->orgId($request))
                ->where('is_active', true)
                ->firstOrFail();
            $conversation->update(['agent_id' => $agent->id]);
        } else {
            $conversation->update(['agent_id' => null]);
        }

        event(new ConversationMiseAJour($conversation->fresh(['inbox', 'contact', 'agent', 'labels'])));

        return new ConversationResource($conversation->fresh(['inbox', 'contact', 'agent', 'labels']));
    }

    public function attachLabel(Request $request, int $id, int $labelId): ConversationResource
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        $conversation = Conversation::query()->findOrFail($id);
        $label = Label::query()->findOrFail($labelId);
        $conversation->labels()->syncWithoutDetaching([$label->id]);

        $fresh = $conversation->fresh(['inbox', 'contact', 'agent', 'labels']);
        event(new ConversationMiseAJour($fresh));

        return new ConversationResource($fresh);
    }

    public function detachLabel(Request $request, int $id, int $labelId): ConversationResource
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        $conversation = Conversation::query()->findOrFail($id);
        $conversation->labels()->detach($labelId);

        $fresh = $conversation->fresh(['inbox', 'contact', 'agent', 'labels']);
        event(new ConversationMiseAJour($fresh));

        return new ConversationResource($fresh);
    }

    public function unreadTotal(Request $request): JsonResponse
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        $total = Conversation::query()
            ->where('archivee', false)
            ->sum('non_lus_count');

        return response()->json(['total' => (int) $total]);
    }

    public function markRead(Request $request, int $id): ConversationResource
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        $conversation = Conversation::query()->findOrFail($id);
        $conversation->update(['non_lus_count' => 0]);

        $fresh = $conversation->fresh(['inbox', 'contact.inboxLinks', 'agent', 'labels']);
        event(new ConversationMiseAJour($fresh));

        return new ConversationResource($fresh);
    }

    public function linkClient(Request $request, int $id): ConversationResource
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        $data = $request->validate([
            'client_id' => ['nullable', 'integer', OrgRules::exists('clients')],
        ]);

        $conversation = Conversation::query()->with('contact')->findOrFail($id);
        $contact = $conversation->contact;
        if (! $contact) {
            abort(422, 'Contact messagerie introuvable.');
        }

        if ($data['client_id'] !== null) {
            $client = \App\Models\Client::query()
                ->where('id', $data['client_id'])
                ->where('orga_id', $this->orgId($request))
                ->firstOrFail();
            $contact->update(['client_id' => $client->id]);
        } else {
            $contact->update(['client_id' => null]);
        }

        $fresh = $conversation->fresh(['inbox', 'contact.client', 'contact.inboxLinks', 'agent', 'labels']);
        event(new ConversationMiseAJour($fresh));

        return new ConversationResource($fresh);
    }
}

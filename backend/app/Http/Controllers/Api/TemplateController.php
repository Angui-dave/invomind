<?php

namespace App\Http\Controllers\Api;

use App\Enums\StatutApprobationModele;
use App\Http\Controllers\Controller;
use App\Http\Resources\MessageTemplateResource;
use App\Jobs\SyncWhatsAppTemplatesJob;
use App\Models\Inbox;
use App\Models\MessageTemplate;
use App\Services\EntitlementService;
use App\Services\Messagerie\TemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TemplateController extends Controller
{
    public function __construct(
        private EntitlementService $entitlements,
        private TemplateService $templates,
    ) {}

    public function index(Request $request, int $inboxId): AnonymousResourceCollection|JsonResponse
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        $inbox = Inbox::query()->findOrFail($inboxId);

        $query = MessageTemplate::query()
            ->where('boite_reception_id', $inbox->id)
            ->orderBy('nom');

        if ($request->boolean('approuves_seulement', true)) {
            $query->where('statut_approbation', StatutApprobationModele::Approuve);
        }

        return $this->paginated($request, $query, MessageTemplateResource::class);
    }

    public function sync(Request $request, int $inboxId): JsonResponse
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        $inbox = Inbox::query()->findOrFail($inboxId);

        if ($request->boolean('async')) {
            SyncWhatsAppTemplatesJob::dispatch($inbox->id);

            return response()->json(['ok' => true, 'queued' => true]);
        }

        $synced = $this->templates->syncFromMeta($inbox);

        return response()->json([
            'ok' => true,
            'count' => count($synced),
            'data' => MessageTemplateResource::collection(collect($synced)),
        ]);
    }
}

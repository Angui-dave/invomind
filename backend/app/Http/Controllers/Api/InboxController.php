<?php

namespace App\Http\Controllers\Api;

use App\Enums\ModeBoiteReception;
use App\Enums\StatutConnexionBoite;
use App\Http\Controllers\Controller;
use App\Http\Requests\InboxRequest;
use App\Http\Resources\InboxResource;
use App\Models\Inbox;
use App\Services\EntitlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class InboxController extends Controller
{
    public function __construct(private EntitlementService $entitlements) {}

    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        $query = Inbox::query()->orderBy('nom');

        return $this->paginated($request, $query, InboxResource::class);
    }

    public function store(InboxRequest $request): InboxResource
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        if ($request->input('canal') === 'tiktok' && ! config('messagerie.tiktok.enabled')) {
            abort(422, 'TikTok n’est pas encore disponible. Voir docs/MESSAGERIE.md.');
        }

        $mode = ModeBoiteReception::tryFrom((string) $request->input('mode', 'fake'))
            ?? ModeBoiteReception::Fake;

        $inbox = Inbox::query()->create([
            'canal' => $request->input('canal'),
            'nom' => $request->input('nom'),
            'mode' => $mode,
            'identifiants' => $request->input('identifiants', []),
            'statut_connexion' => $mode === ModeBoiteReception::Fake
                ? StatutConnexionBoite::Connectee
                : StatutConnexionBoite::Desactivee,
            'actif' => $request->boolean('actif', true),
        ]);

        return new InboxResource($inbox);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        $inbox = Inbox::query()->findOrFail($id);
        $inbox->delete();

        return response()->json(['ok' => true]);
    }
}

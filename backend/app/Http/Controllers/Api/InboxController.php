<?php

namespace App\Http\Controllers\Api;

use App\Enums\ModeBoiteReception;
use App\Enums\StatutConnexionBoite;
use App\Http\Controllers\Controller;
use App\Http\Requests\InboxRequest;
use App\Http\Resources\InboxResource;
use App\Models\Inbox;
use App\Services\EntitlementService;
use App\Services\Messagerie\CanalAdapterFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class InboxController extends Controller
{
    public function __construct(
        private EntitlementService $entitlements,
        private CanalAdapterFactory $adapters,
    ) {}

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

    public function update(InboxRequest $request, int $id): InboxResource
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        $inbox = Inbox::query()->findOrFail($id);

        if ($request->input('canal') === 'tiktok' && ! config('messagerie.tiktok.enabled')) {
            abort(422, 'TikTok n’est pas encore disponible. Voir docs/MESSAGERIE.md.');
        }

        $mode = ModeBoiteReception::tryFrom((string) $request->input('mode', $inbox->mode?->value ?? 'fake'))
            ?? $inbox->mode
            ?? ModeBoiteReception::Fake;

        $existingCreds = $inbox->identifiants ?? [];
        $incomingCreds = $request->input('identifiants');
        $mergedCreds = is_array($incomingCreds)
            ? array_filter(
                array_merge($existingCreds, $incomingCreds),
                fn ($v) => $v !== null && $v !== ''
            )
            : $existingCreds;

        // Keep previous access_token when the client omits it (edit form without re-entry).
        if (
            is_array($incomingCreds)
            && empty($incomingCreds['access_token'])
            && ! empty($existingCreds['access_token'])
        ) {
            $mergedCreds['access_token'] = $existingCreds['access_token'];
        }

        $inbox->update([
            'canal' => $request->input('canal', $inbox->canal?->value ?? $inbox->canal),
            'nom' => $request->input('nom', $inbox->nom),
            'mode' => $mode,
            'identifiants' => $mergedCreds,
            'actif' => $request->has('actif') ? $request->boolean('actif') : $inbox->actif,
        ]);

        return new InboxResource($inbox->fresh());
    }

    public function testConnection(Request $request, int $id): JsonResponse
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        $inbox = Inbox::query()->findOrFail($id);
        $adapter = $this->adapters->for($inbox);

        $verify = $adapter->verifierIdentifiants($inbox);
        if (! $verify->success) {
            $inbox->update([
                'statut_connexion' => StatutConnexionBoite::Erreur,
                'derniere_erreur' => $verify->erreur ?? 'Identifiants invalides',
            ]);

            return response()->json([
                'ok' => false,
                'message' => $verify->erreur ?? 'Identifiants invalides',
                'data' => new InboxResource($inbox->fresh()),
            ], 422);
        }

        $subscribe = $adapter->souscrirePageWebhook($inbox);
        if (! $subscribe->success) {
            $inbox->update([
                'statut_connexion' => StatutConnexionBoite::Erreur,
                'derniere_erreur' => $subscribe->erreur ?? 'Échec abonnement webhook',
            ]);

            return response()->json([
                'ok' => false,
                'message' => $subscribe->erreur ?? 'Échec abonnement webhook',
                'data' => new InboxResource($inbox->fresh()),
            ], 422);
        }

        $inbox->update([
            'statut_connexion' => StatutConnexionBoite::Connectee,
            'derniere_erreur' => null,
        ]);

        return response()->json([
            'ok' => true,
            'message' => 'Boîte connectée et abonnée au webhook Meta.',
            'data' => new InboxResource($inbox->fresh()),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        $inbox = Inbox::query()->findOrFail($id);
        $inbox->delete();

        return response()->json(['ok' => true]);
    }
}

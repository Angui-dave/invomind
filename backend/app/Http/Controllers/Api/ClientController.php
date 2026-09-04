<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use App\Services\EntitlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ClientController extends Controller
{
    /**
     * Org-wide listing for both admin and agent (no commercial/user_id filter).
     */
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        $query = Client::query()->orderByDesc('created_at');

        return $this->paginated($request, $query, ClientResource::class);
    }

    public function show(Request $request, int $id): ClientResource
    {
        $client = Client::query()->findOrFail($id);

        return new ClientResource($client);
    }

    public function store(ClientRequest $request, EntitlementService $entitlements): JsonResponse
    {
        $entitlements->assertCanCreateClient($this->orgId($request));

        $data = $request->validated();
        $client = Client::create([
            ...$data,
            'orga_id' => $this->orgId($request),
            'user_id' => $data['user_id'] ?? $request->user()->id,
            'devise' => $data['devise']
                ?? $request->user()->organization?->devise_defaut
                ?? 'XOF',
        ]);

        return (new ClientResource($client))
            ->response()
            ->setStatusCode(201);
    }

    public function update(ClientRequest $request, int $id): ClientResource
    {
        $client = Client::query()->findOrFail($id);
        $client->update($request->validated());

        return new ClientResource($client->fresh());
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $client = Client::query()->findOrFail($id);
        $client->delete();

        return response()->json(null, 204);
    }
}

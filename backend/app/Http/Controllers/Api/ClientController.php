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
use Illuminate\Support\Str;

class ClientController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $clients = Client::where('organization_id', $this->orgId($request))
            ->orderBy('created_at', 'desc')
            ->get();

        return ClientResource::collection($clients);
    }

    public function show(Request $request, string $id): ClientResource
    {
        $client = Client::where('organization_id', $this->orgId($request))
            ->findOrFail($id);

        return new ClientResource($client);
    }

    public function store(ClientRequest $request, EntitlementService $entitlements): JsonResponse
    {
        $entitlements->assertCanCreateClient($this->orgId($request));

        $client = Client::create([
            ...$request->validated(),
            'organization_id' => $this->orgId($request),
            'portal_token' => Str::random(32),
        ]);

        return (new ClientResource($client))
            ->response()
            ->setStatusCode(201);
    }

    public function update(ClientRequest $request, string $id): ClientResource
    {
        $client = Client::where('organization_id', $this->orgId($request))
            ->findOrFail($id);

        $client->update($request->validated());

        return new ClientResource($client->fresh());
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $client = Client::where('organization_id', $this->orgId($request))
            ->findOrFail($id);

        $client->delete();

        return response()->json(null, 204);
    }
}

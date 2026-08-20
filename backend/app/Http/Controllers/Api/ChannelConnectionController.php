<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChannelConnection;
use App\Services\EntitlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ChannelConnectionController extends Controller
{
    public function index(Request $request, EntitlementService $entitlements): JsonResponse
    {
        $entitlements->assertModule($this->orgId($request), 'conversations');

        $connections = ChannelConnection::query()
            ->where('organization_id', $this->orgId($request))
            ->orderBy('created_at')
            ->get();

        return response()->json($connections->map(fn (ChannelConnection $row) => $this->payload($row)));
    }

    public function store(Request $request, EntitlementService $entitlements): JsonResponse
    {
        $entitlements->assertModule($this->orgId($request), 'conversations');

        $data = $request->validate([
            'channel' => ['required', 'in:whatsapp,messenger,instagram,tiktok'],
            'external_id' => ['required', 'string', 'max:255'],
            'display_name' => ['nullable', 'string', 'max:255'],
        ]);

        $connection = ChannelConnection::withoutGlobalScopes()->updateOrCreate(
            [
                'channel' => $data['channel'],
                'external_id' => $data['external_id'],
            ],
            [
                'organization_id' => $this->orgId($request),
                'display_name' => $data['display_name'] ?? null,
            ],
        );

        return response()->json($this->payload($connection), 201);
    }

    public function destroy(Request $request, string $id, EntitlementService $entitlements): Response
    {
        $entitlements->assertModule($this->orgId($request), 'conversations');

        $connection = ChannelConnection::query()
            ->where('organization_id', $this->orgId($request))
            ->findOrFail($id);

        $connection->delete();

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(ChannelConnection $connection): array
    {
        return [
            'id' => $connection->id,
            'channel' => $connection->channel,
            'external_id' => $connection->external_id,
            'display_name' => $connection->display_name,
            'created_at' => $connection->created_at,
        ];
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Membership;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $members = Membership::query()
            ->where('organization_id', $this->orgId($request))
            ->where('role', 'member')
            ->with('user')
            ->orderBy('created_at')
            ->get()
            ->map(fn (Membership $membership) => $this->payload($membership));

        return response()->json($members);
    }

    public function store(): JsonResponse
    {
        return response()->json([
            'message' => 'La création directe d’agent est désactivée. Utilisez POST /organization/invitations.',
        ], 410);
    }

    public function enable(Request $request, string $id): JsonResponse
    {
        $membership = $this->member($request, $id);
        $membership->update(['disabled_at' => null]);

        return response()->json($this->payload($membership->fresh('user')));
    }

    public function disable(Request $request, string $id): JsonResponse
    {
        $membership = $this->member($request, $id);
        $membership->update(['disabled_at' => now()]);

        return response()->json($this->payload($membership->fresh('user')));
    }

    private function member(Request $request, string $id): Membership
    {
        return Membership::query()
            ->where('organization_id', $this->orgId($request))
            ->where('role', 'member')
            ->where('id', $id)
            ->firstOrFail();
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Membership $membership): array
    {
        return [
            'id' => $membership->id,
            'user_id' => $membership->user_id,
            'name' => $membership->user?->name,
            'email' => $membership->user?->email,
            'role' => $membership->role,
            'status' => $membership->isDisabled() ? 'disabled' : 'active',
            'disabled_at' => $membership->disabled_at,
            'created_at' => $membership->created_at,
        ];
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Membership;
use App\Models\Organization;
use App\Services\InvitationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationInvitationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $invitations = Organization::query()
            ->findOrFail($this->orgId($request))
            ->invitations()
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->orderByDesc('created_at')
            ->get(['id', 'email', 'role', 'expires_at', 'created_at']);

        return response()->json($invitations);
    }

    public function store(Request $request, InvitationService $invitations): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'role' => ['sometimes', 'in:admin,member'],
        ]);

        $role = $data['role'] ?? 'member';
        $membershipRole = $request->attributes->get('membership_role');

        if ($role === 'admin' && $membershipRole !== 'owner') {
            return response()->json([
                'message' => 'Seul le propriétaire peut inviter un administrateur.',
            ], 403);
        }

        $organization = Organization::query()->findOrFail($this->orgId($request));
        $invitation = $invitations->invite(
            $organization,
            $request->user(),
            $data['email'],
            $role,
        );

        return response()->json($invitation, 201);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $invitation = Organization::query()
            ->findOrFail($this->orgId($request))
            ->invitations()
            ->whereNull('accepted_at')
            ->where('id', $id)
            ->firstOrFail();

        $invitation->delete();

        return response()->json(null, 204);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Enums\AbonnementStatut;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\EntitlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AgentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $agents = User::query()
            ->where('orga_id', $this->orgId($request))
            ->where('role', UserRole::Agent)
            ->orderBy('full_name')
            ->get()
            ->map(fn (User $user) => $this->payload($user));

        return response()->json($agents);
    }

    public function store(Request $request, EntitlementService $entitlements): JsonResponse
    {
        $entitlements->assertCanInviteAgent($this->orgId($request));

        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'max:128', PasswordRule::min(10)->letters()->numbers()],
        ]);

        $user = User::create([
            'orga_id' => $this->orgId($request),
            'full_name' => $data['full_name'],
            'email' => $data['email'],
            'password_hash' => Hash::make($data['password']),
            'role' => UserRole::Agent,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        return response()->json($this->payload($user), 201);
    }

    public function enable(Request $request, int $id): JsonResponse
    {
        $user = $this->agent($request, $id);
        $user->update(['is_active' => true]);

        return response()->json($this->payload($user->fresh()));
    }

    public function disable(Request $request, int $id): JsonResponse
    {
        $user = $this->agent($request, $id);
        $user->update(['is_active' => false]);
        $user->tokens()->delete();

        return response()->json($this->payload($user->fresh()));
    }

    private function agent(Request $request, int $id): User
    {
        return User::query()
            ->where('orga_id', $this->orgId($request))
            ->where('role', UserRole::Agent)
            ->whereKey($id)
            ->firstOrFail();
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(User $user): array
    {
        return [
            'id' => $user->id,
            'uuid' => $user->uuid,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'role' => $user->role?->value ?? $user->role,
            'status' => $user->is_active ? 'active' : 'disabled',
            'is_active' => $user->is_active,
            'created_at' => $user->created_at,
        ];
    }
}

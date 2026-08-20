<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Membership;
use App\Models\Organization;
use App\Models\OrganizationBranding;
use App\Models\OrganizationFeatures;
use App\Models\OrganizationSettings;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        Plan::updateOrCreate(['id' => 'free'], [
            'name' => 'Gratuit',
            'price' => 0,
            'price_label' => '0 XOF/mois',
            'description' => 'Plan de démarrage',
            'features' => ['Facturation', 'Clients', 'Rapports de base'],
            'limit_label' => '5 factures/mois',
            'highlighted' => false,
            'max_invoices_per_month' => 5,
            'max_clients' => 10,
            'auto_reminders' => false,
            'online_payments' => false,
            'pipeline' => false,
            'conversations' => false,
            'reports' => true,
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password_hash' => Hash::make($data['password']),
        ]);

        $org = Organization::create([
            'name' => $data['company_name'],
            'slug' => Str::slug($data['company_name']) . '-' . Str::random(6),
        ]);

        Membership::create([
            'organization_id' => $org->id,
            'user_id' => $user->id,
            'role' => 'owner',
        ]);

        Subscription::create(['organization_id' => $org->id]);
        OrganizationSettings::create([
            'organization_id' => $org->id,
            'company_name' => $data['company_name'],
            'email' => $data['email'],
        ]);
        OrganizationBranding::create(['organization_id' => $org->id]);
        OrganizationFeatures::create(['organization_id' => $org->id]);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $user,
            'organization' => $org,
            'token' => $token,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password_hash)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $token = $user->createToken('api')->plainTextToken;

        $membership = Membership::where('user_id', $user->id)->first();

        return response()->json([
            'user' => $user,
            'organization_id' => $membership?->organization_id,
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $membership = Membership::where('user_id', $user->id)->first();

        return response()->json([
            'user' => $user,
            'organization_id' => $membership?->organization_id,
            'role' => $membership?->role,
        ]);
    }
}

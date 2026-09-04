<?php

namespace App\Http\Controllers\Api;

use App\Enums\AbonnementStatut;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Organization;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\OrganizationBootstrapService;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        [$user, $org] = DB::transaction(function () use ($data) {
            $org = Organization::create([
                'name_company' => $data['company_name'],
                'full_name' => $data['name'],
                'email' => $data['email'],
            ]);

            $user = User::create([
                'orga_id' => $org->id,
                'full_name' => $data['name'],
                'email' => $data['email'],
                'password_hash' => Hash::make($data['password']),
                'role' => UserRole::Admin,
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            $plan = Plan::query()->firstOrCreate(
                ['code' => 'gratuit'],
                [
                    'nom' => 'Gratuit',
                    'prix_mensuel' => 0,
                    'devise' => 'XOF',
                    'limite_factures_mois' => 10,
                    'limite_utilisateurs' => 1,
                    'actif' => true,
                ],
            );

            Subscription::create([
                'orga_id' => $org->id,
                'plan_id' => $plan->id,
                'date_debut' => now()->toDateString(),
                'statut' => AbonnementStatut::EnCours,
                'renouvellement_auto' => true,
            ]);

            app(OrganizationBootstrapService::class)->seedExpenseCategories($org);
            app(OrganizationBootstrapService::class)->seedReminderRules($org);

            return [$user, $org];
        });

        $user->forceFill(['last_login_at' => now()])->save();
        $token = $user->createToken('api')->plainTextToken;

        return response()->json($this->authPayload($user->fresh(), $token), 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password_hash)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Ce compte a été désactivé.'], 403);
        }

        if (! $user->orga_id) {
            return response()->json(['message' => 'Aucune organisation associée.'], 403);
        }

        $user->forceFill(['last_login_at' => now()])->save();

        $user->tokens()->where('name', 'api')->delete();
        $token = $user->createToken('api')->plainTextToken;

        return response()->json(
            $this->authPayload($user->fresh(), $token)
        );
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        Password::sendResetLink(['email' => $data['email']]);

        return response()->json([
            'message' => 'Si un compte existe pour cette adresse, un e-mail a été envoyé.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'max:128', PasswordRule::min(10)->letters()->numbers()],
        ]);

        $status = Password::reset(
            [
                'email' => $data['email'],
                'password' => $data['password'],
                'password_confirmation' => $data['password'],
                'token' => $data['token'],
            ],
            function (User $user, string $password): void {
                $user->forceFill([
                    'password_hash' => Hash::make($password),
                ])->save();
                $user->tokens()->delete();
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Ce lien de réinitialisation est invalide ou a déjà été utilisé.'], 422);
        }

        return response()->json(['message' => 'Mot de passe mis à jour.']);
    }

    public function verifyEmail(Request $request, string $id, string $hash): RedirectResponse|JsonResponse
    {
        $user = User::query()->findOrFail($id);

        if (! hash_equals(sha1($user->getEmailForVerification()), (string) $hash)) {
            abort(403, 'Lien de vérification invalide.');
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        $frontend = rtrim((string) config('services.frontend.url'), '/');

        if ($request->expectsJson()) {
            return response()->json(['message' => 'E-mail vérifié.']);
        }

        return redirect()->away($frontend.'/login?verified=1');
    }

    public function resendVerification(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if ($user && ! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return response()->json([
            'message' => 'Si un compte non vérifié existe pour cet e-mail, un nouveau lien a été envoyé.',
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

        if (! $user->is_active || ! $user->orga_id) {
            return response()->json(['message' => 'No organization context.'], 403);
        }

        return response()->json($this->authPayload($user->loadMissing('organization.subscription.plan'), null));
    }

    /**
     * Stable auth envelope for register / login / me.
     * IDs are always strings so the Next.js BFF can compare cookies safely.
     *
     * @return array<string, mixed>
     */
    private function authPayload(User $user, ?string $token): array
    {
        $org = $user->organization ?? Organization::with('subscription.plan')->find($user->orga_id);
        $planCode = $org?->subscription?->plan?->code;

        $payload = [
            'user' => [
                'id' => (string) $user->id,
                'uuid' => $user->uuid,
                'email' => $user->email,
                'full_name' => $user->full_name,
                'name' => $user->full_name,
                'role' => $user->role?->value ?? $user->role,
                'is_active' => (bool) $user->is_active,
            ],
            'organization_id' => (string) $user->orga_id,
            'organization' => $org ? [
                'id' => (string) $org->id,
                'uuid' => $org->uuid,
                'name' => $org->name_company,
                'name_company' => $org->name_company,
                'slug' => $org->uuid,
                'plan_id' => $planCode === 'gratuit' ? 'free' : ($planCode ?? 'free'),
                'plan_code' => $planCode,
                'email' => $org->email,
                'logo_url' => $org->logo_url,
                'devise_defaut' => $org->devise_defaut,
            ] : null,
            'role' => $user->role?->value ?? $user->role,
        ];

        if ($token !== null) {
            $payload['token'] = $token;
        }

        return $payload;
    }
}

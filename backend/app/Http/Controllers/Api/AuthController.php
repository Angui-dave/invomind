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
use App\Models\Subscription;
use App\Models\User;
use App\Services\DefaultEmailTemplateService;
use App\Services\InvitationService;
use App\Services\OrganizationBootstrapService;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password_hash' => Hash::make($data['password']),
        ]);

        $org = Organization::create([
            'name' => $data['company_name'],
            'slug' => Str::slug($data['company_name']).'-'.Str::random(6),
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
        OrganizationFeatures::create([
            'organization_id' => $org->id,
            'pipeline' => true,
            'conversations' => true,
            'expenses' => true,
            'catalog' => true,
            'reports' => true,
            'import_tool' => true,
        ]);
        app(DefaultEmailTemplateService::class)->seedFor($org);
        app(OrganizationBootstrapService::class)->seedExpenseCategories($org);

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Compte créé. Vérifiez votre e-mail avant de vous connecter.',
            'email_verification_required' => true,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
            ],
            'organization_id' => $org->id,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password_hash)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if (! $user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Veuillez vérifier votre e-mail avant de vous connecter.',
                'email_verification_required' => true,
            ], 403);
        }

        $membership = $this->resolveMembership($user->id, $request->header('X-Organization-Id'));

        if ($membership?->isDisabled()) {
            return response()->json(['message' => 'Ce compte a été désactivé.'], 403);
        }

        if (! $membership) {
            return response()->json(['message' => 'Aucune organisation associée.'], 403);
        }

        $user->tokens()->where('name', 'api')->delete();
        $token = $user->createToken('api')->plainTextToken;

        return response()->json(
            $this->authPayload($user, $membership->organization_id, $membership->role, $token)
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

    public function acceptInvitation(Request $request, InvitationService $invitations): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'password' => ['required', 'string', 'max:128', PasswordRule::min(10)->letters()->numbers()],
        ]);

        $accepted = $invitations->accept($data['token'], $data['name'], $data['password']);
        $invitation = $accepted['invitation'];

        return response()->json(
            $this->authPayload(
                $accepted['user'],
                $invitation->organization_id,
                $invitation->role,
                $accepted['token'],
            ),
            201,
        );
    }

    /**
     * Signed email verification link — marks the user verified then redirects to the frontend login.
     */
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

        if (! $user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Veuillez vérifier votre e-mail.',
                'email_verification_required' => true,
            ], 403);
        }

        $membership = $this->resolveMembership(
            $user->id,
            $request->header('X-Organization-Id'),
        );

        if (! $membership) {
            return response()->json(['message' => 'No organization context.'], 403);
        }

        if ($membership->isDisabled()) {
            return response()->json(['message' => 'Ce compte a été désactivé.'], 403);
        }

        return response()->json(
            $this->authPayload($user, $membership->organization_id, $membership->role, null)
        );
    }

    /**
     * Prefer the membership for X-Organization-Id when present and valid;
     * otherwise fall back to the first active membership.
     */
    private function resolveMembership(string $userId, ?string $organizationId): ?Membership
    {
        if ($organizationId) {
            $scoped = Membership::query()
                ->where('user_id', $userId)
                ->where('organization_id', $organizationId)
                ->first();

            if ($scoped) {
                return $scoped;
            }
        }

        return Membership::query()
            ->where('user_id', $userId)
            ->whereNull('disabled_at')
            ->orderBy('created_at')
            ->first()
            ?? Membership::query()->where('user_id', $userId)->orderBy('created_at')->first();
    }

    /**
     * Unified auth envelope for register / login / me / acceptInvitation.
     *
     * @return array{user: User, organization_id: string, organization: Organization|null, role: string, token?: string}
     */
    private function authPayload(User $user, string $organizationId, string $role, ?string $token): array
    {
        $payload = [
            'user' => $user,
            'organization_id' => $organizationId,
            'organization' => Organization::find($organizationId),
            'role' => $role,
        ];

        if ($token !== null) {
            $payload['token'] = $token;
        }

        return $payload;
    }
}

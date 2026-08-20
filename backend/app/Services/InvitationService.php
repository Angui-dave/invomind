<?php

namespace App\Services;

use App\Mail\InvitationMail;
use App\Models\Membership;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

class InvitationService
{
    public function __construct(
        private EntitlementService $entitlements,
    ) {}

    public function invite(Organization $organization, User $inviter, string $email, string $role = 'member'): OrganizationInvitation
    {
        $email = mb_strtolower(trim($email));

        if ($inviter->email === $email) {
            throw new HttpException(422, 'Vous ne pouvez pas vous inviter vous-même.');
        }

        $alreadyMember = Membership::query()
            ->where('organization_id', $organization->id)
            ->whereHas('user', fn ($query) => $query->where('email', $email))
            ->exists();

        if ($alreadyMember) {
            throw new HttpException(422, 'Cette personne est déjà membre de l’organisation.');
        }

        $pending = OrganizationInvitation::query()
            ->where('organization_id', $organization->id)
            ->where('email', $email)
            ->whereNull('accepted_at')
            ->first();

        if (! $pending) {
            $this->entitlements->assertCanInviteAgent($organization->id);
        }

        $plain = Str::random(40);
        $attributes = [
            'role' => $role,
            'token_hash' => OrganizationInvitation::hashToken($plain),
            'invited_by' => $inviter->id,
            'expires_at' => now()->addDays(7),
        ];

        if ($pending) {
            $pending->fill($attributes)->save();
            $invitation = $pending->fresh();
        } else {
            $invitation = OrganizationInvitation::query()->create([
                'organization_id' => $organization->id,
                'email' => $email,
                ...$attributes,
            ]);
        }

        Mail::to($email)->send(new InvitationMail($invitation, $plain, $organization));

        return $invitation;
    }

    /**
     * @return array{user: User, invitation: OrganizationInvitation, token: string}
     */
    public function accept(string $plainToken, string $name, string $password): array
    {
        $invitation = OrganizationInvitation::query()
            ->where('token_hash', OrganizationInvitation::hashToken($plainToken))
            ->first();

        if (! $invitation) {
            throw new HttpException(404, 'Invitation introuvable.');
        }

        if ($invitation->isAccepted()) {
            throw new HttpException(410, 'Cette invitation a déjà été utilisée.');
        }

        if ($invitation->isExpired()) {
            throw new HttpException(410, 'Cette invitation a expiré.');
        }

        if (User::query()->where('email', $invitation->email)->exists()) {
            throw new HttpException(422, 'Un compte existe déjà avec cet e-mail.');
        }

        $user = User::query()->create([
            'name' => $name,
            'email' => $invitation->email,
            'password_hash' => Hash::make($password),
            'email_verified_at' => now(),
        ]);

        Membership::query()->create([
            'organization_id' => $invitation->organization_id,
            'user_id' => $user->id,
            'role' => $invitation->role,
        ]);

        $invitation->update(['accepted_at' => now()]);

        return [
            'user' => $user,
            'invitation' => $invitation,
            'token' => $user->createToken('api')->plainTextToken,
        ];
    }
}

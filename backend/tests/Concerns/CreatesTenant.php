<?php

namespace Tests\Concerns;

use App\Enums\AbonnementStatut;
use App\Enums\UserRole;
use App\Models\Client;
use App\Models\Organization;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

trait CreatesTenant
{
    protected User $user;

    protected Organization $organization;

    protected Client $client;

    protected function seedTenant(string $planCode = 'pro'): void
    {
        $this->ensurePlan('gratuit', 10, 1);
        $this->ensurePlan('pro', 100, 5);
        $this->ensurePlan('business', null, null);

        $plan = Plan::query()->where('code', $planCode)->firstOrFail();

        $this->organization = Organization::create([
            'name_company' => 'Atelier Diallo',
            'full_name' => 'Lea Diallo',
            'email' => 'contact-'.Str::random(6).'@atelier.test',
            'pays' => "Côte d'Ivoire",
            'devise_defaut' => 'XOF',
        ]);

        $this->user = User::create([
            'orga_id' => $this->organization->id,
            'full_name' => 'Lea Diallo',
            'email' => 'lea-'.Str::random(8).'@test.invomind',
            'password_hash' => Hash::make('password123'),
            'role' => UserRole::Admin,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        Subscription::create([
            'orga_id' => $this->organization->id,
            'plan_id' => $plan->id,
            'date_debut' => now()->toDateString(),
            'statut' => AbonnementStatut::EnCours,
            'renouvellement_auto' => true,
        ]);

        $this->client = Client::create([
            'orga_id' => $this->organization->id,
            'user_id' => $this->user->id,
            'name_company' => 'Ndiaye SARL',
            'email' => 'aminata@ndiaye.test',
            'devise' => 'XOF',
        ]);

        Sanctum::actingAs($this->user);
    }

    protected function ensurePlan(string $code, ?int $maxInvoices, ?int $maxUsers): void
    {
        Plan::query()->updateOrCreate(['code' => $code], [
            'nom' => match ($code) {
                'pro' => 'Pro',
                'business' => 'Business',
                default => 'Gratuit',
            },
            'prix_mensuel' => match ($code) {
                'pro' => 15000,
                'business' => 45000,
                default => 0,
            },
            'devise' => 'XOF',
            'limite_factures_mois' => $maxInvoices,
            'limite_utilisateurs' => $maxUsers,
            'actif' => true,
        ]);
    }

    /**
     * @return array<string, string>
     */
    protected function tenantHeaders(): array
    {
        return [
            'Accept' => 'application/json',
            'X-Organization-Id' => (string) $this->organization->id,
        ];
    }
}

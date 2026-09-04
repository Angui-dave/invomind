<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        Plan::query()->updateOrCreate(['code' => 'gratuit'], [
            'nom' => 'Gratuit',
            'prix_mensuel' => 0,
            'devise' => 'XOF',
            'limite_factures_mois' => 10,
            'limite_utilisateurs' => 1,
            'limite_clients' => null,
            'fonctionnalites' => null,
            'actif' => true,
        ]);

        Plan::query()->updateOrCreate(['code' => 'pro'], [
            'nom' => 'Pro',
            'prix_mensuel' => 15000,
            'devise' => 'XOF',
            'limite_factures_mois' => 100,
            'limite_utilisateurs' => 5,
            'limite_clients' => null,
            'fonctionnalites' => null,
            'actif' => true,
        ]);

        Plan::query()->updateOrCreate(['code' => 'business'], [
            'nom' => 'Business',
            'prix_mensuel' => 45000,
            'devise' => 'XOF',
            'limite_factures_mois' => null,
            'limite_utilisateurs' => null,
            'limite_clients' => null,
            'fonctionnalites' => null,
            'actif' => true,
        ]);
    }
}

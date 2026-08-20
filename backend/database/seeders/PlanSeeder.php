<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        Plan::updateOrCreate(['id' => 'free'], [
            'name' => 'Gratuit',
            'price' => 0,
            'price_label' => '0 XOF/mois',
            'description' => 'Pour démarrer',
            'features' => ['5 factures/mois', '10 clients', 'Dépenses & catalogue', 'Rapports de base'],
            'limit_label' => '5 factures/mois',
            'highlighted' => false,
            'max_invoices_per_month' => 5,
            'max_clients' => 10,
            'max_agents' => 0,
            'auto_reminders' => false,
            'online_payments' => false,
            'pipeline' => false,
            'conversations' => false,
            'reports' => true,
            'expenses' => true,
            'catalog' => true,
            'import_tool' => false,
        ]);

        Plan::updateOrCreate(['id' => 'pro'], [
            'name' => 'Pro',
            'price' => 9900,
            'price_label' => '9 900 XOF/mois',
            'description' => 'Pour les professionnels',
            'features' => [
                'Factures illimitées',
                'Clients illimités',
                'Relances automatiques',
                'Pipeline commercial',
                'Conversations',
                'Paiement en ligne',
                'Import CSV',
                '3 membres',
            ],
            'limit_label' => null,
            'highlighted' => true,
            'max_invoices_per_month' => null,
            'max_clients' => null,
            'max_agents' => 3,
            'auto_reminders' => true,
            'online_payments' => true,
            'pipeline' => true,
            'conversations' => true,
            'reports' => true,
            'expenses' => true,
            'catalog' => true,
            'import_tool' => true,
        ]);

        Plan::updateOrCreate(['id' => 'business'], [
            'name' => 'Business',
            'price' => 29000,
            'price_label' => '29 000 XOF/mois',
            'description' => 'Pour les équipes en croissance',
            'features' => ['Tout Pro', 'Jusqu’à 10 membres', 'Support prioritaire'],
            'limit_label' => null,
            'highlighted' => false,
            'max_invoices_per_month' => null,
            'max_clients' => null,
            'max_agents' => 10,
            'auto_reminders' => true,
            'online_payments' => true,
            'pipeline' => true,
            'conversations' => true,
            'reports' => true,
            'expenses' => true,
            'catalog' => true,
            'import_tool' => true,
        ]);
    }
}

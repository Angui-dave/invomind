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
            'features' => ['5 factures/mois', '10 clients', 'Rapports de base'],
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

        Plan::updateOrCreate(['id' => 'pro'], [
            'name' => 'Pro',
            'price' => 9900,
            'price_label' => '9 900 XOF/mois',
            'description' => 'Pour les professionnels',
            'features' => ['Factures illimitées', 'Clients illimités', 'Relances automatiques', 'Pipeline commercial', 'Conversations', 'Paiement en ligne'],
            'limit_label' => null,
            'highlighted' => true,
            'max_invoices_per_month' => null,
            'max_clients' => null,
            'auto_reminders' => true,
            'online_payments' => true,
            'pipeline' => true,
            'conversations' => true,
            'reports' => true,
            'stripe_price_id' => config('services.stripe.price_pro'),
        ]);
    }
}

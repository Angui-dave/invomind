<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id(); // plan_id enum used as text key
            $table->text('name');
            $table->integer('price')->default(0);
            $table->text('price_label');
            $table->text('description');
            $table->jsonb('features')->default('[]');
            $table->text('limit_label')->nullable();
            $table->boolean('highlighted')->default(false);
            $table->integer('max_invoices_per_month')->nullable();
            $table->integer('max_clients')->nullable();
            $table->boolean('auto_reminders')->default(false);
            $table->boolean('online_payments')->default(false);
            $table->boolean('pipeline')->default(false);
            $table->boolean('conversations')->default(false);
            $table->boolean('reports')->default(true);
            $table->text('stripe_price_id')->nullable();
        });

        DB::table('plans')->insert([
            [
                'id' => 'free',
                'name' => 'Gratuit',
                'price' => 0,
                'price_label' => '0 XOF/mois',
                'description' => 'Pour démarrer',
                'features' => json_encode(['5 factures/mois', '10 clients', 'Dépenses & catalogue', 'Rapports de base']),
                'limit_label' => '5 factures/mois',
                'highlighted' => false,
                'max_invoices_per_month' => 5,
                'max_clients' => 10,
                'auto_reminders' => false,
                'online_payments' => false,
                'pipeline' => false,
                'conversations' => false,
                'reports' => true,
            ],
            [
                'id' => 'pro',
                'name' => 'Pro',
                'price' => 9900,
                'price_label' => '9 900 XOF/mois',
                'description' => 'Pour les professionnels',
                'features' => json_encode([
                    'Factures illimitées',
                    'Clients illimités',
                    'Relances automatiques',
                    'Pipeline commercial',
                    'Conversations',
                    'Paiement en ligne',
                    'Import CSV',
                    '3 membres',
                ]),
                'limit_label' => null,
                'highlighted' => true,
                'max_invoices_per_month' => null,
                'max_clients' => null,
                'auto_reminders' => true,
                'online_payments' => true,
                'pipeline' => true,
                'conversations' => true,
                'reports' => true,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};

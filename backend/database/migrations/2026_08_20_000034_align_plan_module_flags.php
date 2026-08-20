<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->boolean('expenses')->default(true)->after('reports');
            $table->boolean('catalog')->default(true)->after('expenses');
            $table->boolean('import_tool')->default(false)->after('catalog');
        });

        DB::table('plans')->where('id', 'free')->update([
            'expenses' => true,
            'catalog' => true,
            'import_tool' => false,
            'max_invoices_per_month' => 5,
            'max_clients' => 10,
            'price' => 0,
            'price_label' => '0 XOF/mois',
            'limit_label' => '5 factures/mois',
        ]);

        DB::table('plans')->where('id', 'pro')->update([
            'expenses' => true,
            'catalog' => true,
            'import_tool' => true,
            'price' => 9900,
            'price_label' => '9 900 XOF/mois',
            'max_agents' => 3,
        ]);

        DB::table('plans')->where('id', 'business')->update([
            'expenses' => true,
            'catalog' => true,
            'import_tool' => true,
            'price' => 29000,
            'price_label' => '29 000 XOF/mois',
            'max_agents' => 10,
        ]);
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['expenses', 'catalog', 'import_tool']);
        });
    }
};

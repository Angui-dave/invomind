<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organisations', function (Blueprint $table) {
            $table->json('parametres')->nullable()->after('devise_defaut');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->boolean('relances_actives')->default(true)->after('numero_fiscal');
        });

        Schema::table('facture_lignes', function (Blueprint $table) {
            $table->decimal('montant_tva', 14, 2)->default(0)->after('montant_ht');
        });

        Schema::table('devis_lignes', function (Blueprint $table) {
            $table->decimal('montant_tva', 14, 2)->default(0)->after('montant_ht');
        });
    }

    public function down(): void
    {
        Schema::table('devis_lignes', function (Blueprint $table) {
            $table->dropColumn('montant_tva');
        });
        Schema::table('facture_lignes', function (Blueprint $table) {
            $table->dropColumn('montant_tva');
        });
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn('relances_actives');
        });
        Schema::table('organisations', function (Blueprint $table) {
            $table->dropColumn('parametres');
        });
    }
};

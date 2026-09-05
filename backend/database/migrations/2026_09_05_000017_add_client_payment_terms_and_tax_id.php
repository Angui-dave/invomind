<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->unsignedSmallInteger('delai_paiement_jours')->default(30)->after('devise');
            $table->string('numero_fiscal', 64)->nullable()->after('delai_paiement_jours');
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn(['delai_paiement_jours', 'numero_fiscal']);
        });
    }
};

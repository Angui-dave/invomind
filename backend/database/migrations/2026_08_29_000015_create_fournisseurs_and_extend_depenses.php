<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fournisseurs', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('orga_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name_company', 255);
            $table->string('contact', 255)->nullable();
            $table->string('email', 255)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('adresse', 255)->nullable();
            $table->string('ville', 100)->nullable();
            $table->string('country', 100)->nullable();
            $table->string('numero_fiscal', 100)->nullable();
            $table->text('notes')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index('orga_id', 'idx_fournisseurs_orga');
        });

        Schema::table('depenses', function (Blueprint $table) {
            $table->foreignId('fournisseur_id')
                ->nullable()
                ->after('categorie_id')
                ->constrained('fournisseurs')
                ->nullOnDelete();
        });

        Schema::table('categories_depense', function (Blueprint $table) {
            $table->string('couleur', 7)->nullable()->after('description');
        });

        // Partial unique: org-scoped categories must have unique names per org.
        // Global rows (orga_id IS NULL) keep the seeder updateOrCreate by (orga_id, nom).
        DB::statement('CREATE UNIQUE INDEX categories_depense_orga_nom_unique ON categories_depense (orga_id, nom) WHERE orga_id IS NOT NULL');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS categories_depense_orga_nom_unique');

        Schema::table('categories_depense', function (Blueprint $table) {
            $table->dropColumn('couleur');
        });

        Schema::table('depenses', function (Blueprint $table) {
            $table->dropConstrainedForeignId('fournisseur_id');
        });

        Schema::dropIfExists('fournisseurs');
    }
};

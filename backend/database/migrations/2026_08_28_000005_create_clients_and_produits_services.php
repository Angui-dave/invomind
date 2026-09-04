<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('orga_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name_company', 255);
            $table->string('email', 255)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('adresse', 255)->nullable();
            $table->string('ville', 100)->nullable();
            $table->string('code_postal', 20)->nullable();
            $table->string('country', 100)->nullable();
            $table->char('devise', 3)->default('XOF');
            $table->text('notes')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index('orga_id', 'idx_clients_orga');
            $table->index('user_id', 'idx_clients_user');
        });

        DB::statement("ALTER TABLE clients ADD COLUMN categorie_client client_categorie DEFAULT 'prospect'");

        Schema::create('produits_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orga_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reference', 50)->nullable();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->decimal('prix_unitaire', 14, 2);
            $table->char('devise', 3)->default('XOF');
            $table->decimal('taux_tva', 5, 2)->default(0);
            $table->string('unite', 20)->default('unité');
            $table->integer('quantite_stock')->default(0);
            $table->boolean('gere_stock')->default(true);
            $table->boolean('actif')->default(true);
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index('orga_id', 'idx_produits_orga');
        });

        DB::statement("ALTER TABLE produits_services ADD COLUMN type produit_type NOT NULL DEFAULT 'produit'");
        DB::statement('ALTER TABLE produits_services ADD CONSTRAINT produits_services_prix_unitaire_check CHECK (prix_unitaire >= 0)');
        DB::statement('ALTER TABLE produits_services ADD CONSTRAINT produits_services_taux_tva_check CHECK (taux_tva BETWEEN 0 AND 100)');
    }

    public function down(): void
    {
        Schema::dropIfExists('produits_services');
        Schema::dropIfExists('clients');
    }
};

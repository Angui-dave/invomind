<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devis', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('orga_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('client_id')->constrained('clients');
            $table->string('numero', 50);
            $table->timestampTz('date_creation')->useCurrent();
            $table->date('date_validite')->nullable();
            $table->char('devise', 3)->default('XOF');
            $table->decimal('sous_total', 14, 2)->default(0);
            $table->decimal('remise_montant', 14, 2)->default(0);
            $table->decimal('montant_tva', 14, 2)->default(0);
            $table->decimal('montant_total', 14, 2)->default(0);
            $table->text('note')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->unique(['orga_id', 'numero']);
            $table->index('orga_id', 'idx_devis_orga');
            $table->index('client_id', 'idx_devis_client');
        });

        DB::statement("ALTER TABLE devis ADD COLUMN statut devis_statut NOT NULL DEFAULT 'brouillon'");
        DB::statement('CREATE INDEX idx_devis_statut ON devis (statut)');

        Schema::create('devis_lignes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('devis_id')->constrained('devis')->cascadeOnDelete();
            $table->foreignId('produit_id')->nullable()->constrained('produits_services')->nullOnDelete();
            $table->string('designation', 255);
            $table->decimal('quantite', 10, 2)->default(1);
            $table->decimal('prix_unitaire', 14, 2);
            $table->decimal('taux_tva', 5, 2)->default(0);
            $table->decimal('remise_pourcentage', 5, 2)->default(0);
            $table->decimal('montant_ht', 14, 2);
            $table->integer('ordre')->default(0);

            $table->index('devis_id', 'idx_devis_lignes_devis');
        });

        DB::statement('ALTER TABLE devis_lignes ADD CONSTRAINT devis_lignes_quantite_check CHECK (quantite > 0)');
        DB::statement('ALTER TABLE devis_lignes ADD CONSTRAINT devis_lignes_prix_unitaire_check CHECK (prix_unitaire >= 0)');
        DB::statement('ALTER TABLE devis_lignes ADD CONSTRAINT devis_lignes_remise_pourcentage_check CHECK (remise_pourcentage BETWEEN 0 AND 100)');
    }

    public function down(): void
    {
        Schema::dropIfExists('devis_lignes');
        Schema::dropIfExists('devis');
    }
};

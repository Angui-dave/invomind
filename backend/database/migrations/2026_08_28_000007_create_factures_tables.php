<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('orga_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('client_id')->constrained('clients');
            $table->foreignId('devis_id')->nullable()->constrained('devis')->nullOnDelete();
            $table->string('numero', 50);
            $table->timestampTz('date_creation')->useCurrent();
            $table->date('date_echeance')->nullable();
            $table->char('devise', 3)->default('XOF');
            $table->decimal('sous_total', 14, 2)->default(0);
            $table->decimal('remise_montant', 14, 2)->default(0);
            $table->decimal('montant_tva', 14, 2)->default(0);
            $table->decimal('montant_total', 14, 2)->default(0);
            $table->decimal('montant_paye', 14, 2)->default(0);
            $table->text('note')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->unique(['orga_id', 'numero']);
            $table->index('orga_id', 'idx_factures_orga');
            $table->index('client_id', 'idx_factures_client');
            $table->index('date_echeance', 'idx_factures_echeance');
        });

        DB::statement("ALTER TABLE factures ADD COLUMN statut facture_statut NOT NULL DEFAULT 'brouillon'");
        DB::statement('CREATE INDEX idx_factures_statut ON factures (statut)');

        Schema::create('facture_lignes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facture_id')->constrained('factures')->cascadeOnDelete();
            $table->foreignId('produit_id')->nullable()->constrained('produits_services')->nullOnDelete();
            $table->string('designation', 255);
            $table->decimal('quantite', 10, 2)->default(1);
            $table->decimal('prix_unitaire', 14, 2);
            $table->decimal('taux_tva', 5, 2)->default(0);
            $table->decimal('remise_pourcentage', 5, 2)->default(0);
            $table->decimal('montant_ht', 14, 2);
            $table->integer('ordre')->default(0);

            $table->index('facture_id', 'idx_facture_lignes_facture');
        });

        Schema::create('paiements_facture', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orga_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('facture_id')->constrained('factures')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('clients');
            $table->decimal('montant', 14, 2);
            $table->char('devise', 3)->default('XOF');
            $table->timestampTz('date_paiement')->useCurrent();
            $table->string('reference', 100)->nullable();
            $table->text('note')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index('facture_id', 'idx_paiements_facture_facture');
        });

        DB::statement('ALTER TABLE paiements_facture ADD COLUMN mode_paiement mode_paiement_enum NOT NULL');
        DB::statement('ALTER TABLE facture_lignes ADD CONSTRAINT facture_lignes_quantite_check CHECK (quantite > 0)');
        DB::statement('ALTER TABLE facture_lignes ADD CONSTRAINT facture_lignes_prix_unitaire_check CHECK (prix_unitaire >= 0)');
        DB::statement('ALTER TABLE facture_lignes ADD CONSTRAINT facture_lignes_remise_pourcentage_check CHECK (remise_pourcentage BETWEEN 0 AND 100)');
        DB::statement('ALTER TABLE paiements_facture ADD CONSTRAINT paiements_facture_montant_check CHECK (montant > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements_facture');
        Schema::dropIfExists('facture_lignes');
        Schema::dropIfExists('factures');
    }
};

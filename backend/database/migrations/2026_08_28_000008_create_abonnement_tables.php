<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans_abonnement', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('nom', 100);
            $table->decimal('prix_mensuel', 10, 2)->default(0);
            $table->decimal('prix_annuel', 10, 2)->nullable();
            $table->char('devise', 3)->default('XOF');
            $table->integer('limite_factures_mois')->nullable();
            $table->integer('limite_utilisateurs')->nullable();
            $table->integer('limite_clients')->nullable();
            $table->jsonb('fonctionnalites')->nullable();
            $table->boolean('actif')->default(true);
        });

        Schema::create('abonnements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orga_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('plans_abonnement');
            $table->date('date_debut')->default(DB::raw('CURRENT_DATE'));
            $table->date('date_fin')->nullable();
            $table->boolean('renouvellement_auto')->default(true);
            $table->timestampsTz();

            $table->index('orga_id', 'idx_abonnements_orga');
        });

        DB::statement("ALTER TABLE abonnements ADD COLUMN statut abonnement_statut NOT NULL DEFAULT 'en_cours'");

        Schema::create('paiements_abonnement', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orga_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('abonnement_id')->constrained('abonnements')->cascadeOnDelete();
            $table->decimal('montant', 10, 2);
            $table->char('devise', 3)->default('XOF');
            $table->string('reference_payement', 100)->nullable();
            $table->timestampTz('date_payement')->useCurrent();
            $table->string('statut', 20)->default('reussi');
            $table->timestampTz('created_at')->useCurrent();

            $table->index('abonnement_id', 'idx_paiements_abo_abonnement');
        });

        DB::statement('ALTER TABLE paiements_abonnement ADD COLUMN mode_paiement mode_paiement_enum');
        DB::statement('ALTER TABLE paiements_abonnement ADD CONSTRAINT paiements_abonnement_montant_check CHECK (montant > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements_abonnement');
        Schema::dropIfExists('abonnements');
        Schema::dropIfExists('plans_abonnement');
    }
};

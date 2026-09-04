<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('regles_relance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orga_id')->nullable()->constrained('organisations')->cascadeOnDelete();
            $table->string('nom', 100);
            $table->integer('decalage_jours');
            $table->string('objet_message', 255)->nullable();
            $table->text('template_message')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestampsTz();

            $table->index('orga_id', 'idx_regles_relance_orga');
        });

        DB::statement("ALTER TABLE regles_relance ADD COLUMN canal relance_canal_enum NOT NULL DEFAULT 'email'");

        Schema::create('relances_facture', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orga_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('facture_id')->constrained('factures')->cascadeOnDelete();
            $table->foreignId('regle_id')->constrained('regles_relance')->restrictOnDelete();
            $table->date('date_prevue');
            $table->string('destinataire', 255)->nullable();
            $table->text('message_envoye')->nullable();
            $table->timestampTz('date_envoi')->nullable();
            $table->integer('tentative_count')->default(0);
            $table->text('derniere_erreur')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['facture_id', 'regle_id']);
            $table->index('facture_id', 'idx_relances_facture_facture');
            $table->index('date_prevue', 'idx_relances_facture_date');
        });

        DB::statement("ALTER TABLE relances_facture ADD COLUMN statut relance_statut_enum NOT NULL DEFAULT 'planifiee'");
        DB::statement('ALTER TABLE relances_facture ADD COLUMN canal relance_canal_enum NOT NULL');
        DB::statement('CREATE INDEX idx_relances_facture_statut ON relances_facture (statut)');
    }

    public function down(): void
    {
        Schema::dropIfExists('relances_facture');
        Schema::dropIfExists('regles_relance');
    }
};

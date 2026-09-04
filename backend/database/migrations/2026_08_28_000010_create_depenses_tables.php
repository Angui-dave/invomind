<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories_depense', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orga_id')->nullable()->constrained('organisations')->cascadeOnDelete();
            $table->string('nom', 100);
            $table->text('description')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestampTz('created_at')->useCurrent();

            $table->index('orga_id', 'idx_categories_depense_orga');
        });

        Schema::create('depenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orga_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('categorie_id')->nullable()->constrained('categories_depense')->nullOnDelete();
            $table->string('libelle', 255);
            $table->text('description')->nullable();
            $table->string('fournisseur', 255)->nullable();
            $table->string('reference', 100)->nullable();
            $table->decimal('montant_ht', 14, 2);
            $table->decimal('taux_tva', 5, 2)->default(0);
            $table->decimal('montant_tva', 14, 2)->default(0);
            $table->char('devise', 3)->default('XOF');
            $table->date('date_depense')->default(DB::raw('CURRENT_DATE'));
            $table->text('piece_jointe_url')->nullable();
            $table->boolean('recurrente')->default(false);
            $table->foreignId('valide_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('date_validation')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index('orga_id', 'idx_depenses_orga');
            $table->index('categorie_id', 'idx_depenses_categorie');
            $table->index('date_depense', 'idx_depenses_date');
        });

        DB::statement('ALTER TABLE depenses ADD COLUMN montant_ttc NUMERIC(14,2) GENERATED ALWAYS AS (montant_ht + montant_tva) STORED');
        DB::statement('ALTER TABLE depenses ADD COLUMN mode_paiement mode_paiement_enum');
        DB::statement('ALTER TABLE depenses ADD COLUMN frequence_recurrence frequence_recurrence_enum');
        DB::statement("ALTER TABLE depenses ADD COLUMN statut depense_statut_enum NOT NULL DEFAULT 'validee'");
        DB::statement('ALTER TABLE depenses ADD CONSTRAINT depenses_montant_ht_check CHECK (montant_ht >= 0)');
        DB::statement('ALTER TABLE depenses ADD CONSTRAINT depenses_taux_tva_check CHECK (taux_tva BETWEEN 0 AND 100)');
        DB::statement('ALTER TABLE depenses ADD CONSTRAINT depenses_montant_tva_check CHECK (montant_tva >= 0)');
        DB::statement('ALTER TABLE depenses ADD CONSTRAINT depenses_recurrence_check CHECK (NOT recurrente OR frequence_recurrence IS NOT NULL)');
    }

    public function down(): void
    {
        Schema::dropIfExists('depenses');
        Schema::dropIfExists('categories_depense');
    }
};

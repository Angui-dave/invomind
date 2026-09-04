<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("DO $$ BEGIN CREATE TYPE statut_approbation_modele AS ENUM ('brouillon', 'soumis', 'approuve', 'rejete'); EXCEPTION WHEN duplicate_object THEN null; END $$");
        DB::statement("DO $$ BEGIN CREATE TYPE categorie_modele_message AS ENUM ('marketing', 'utility', 'authentication'); EXCEPTION WHEN duplicate_object THEN null; END $$");

        Schema::create('modeles_message', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('orga_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('boite_reception_id')->constrained('boites_reception')->cascadeOnDelete();
            $table->string('nom');
            $table->string('langue', 16)->default('fr');
            $table->jsonb('composants')->nullable();
            $table->string('id_externe_meta')->nullable();
            $table->text('corps_apercu')->nullable();
            $table->timestamps();

            $table->unique(['boite_reception_id', 'nom', 'langue']);
            $table->index(['orga_id']);
        });

        DB::statement("ALTER TABLE modeles_message ADD COLUMN categorie categorie_modele_message NOT NULL DEFAULT 'utility'");
        DB::statement("ALTER TABLE modeles_message ADD COLUMN statut_approbation statut_approbation_modele NOT NULL DEFAULT 'brouillon'");
        DB::statement('CREATE INDEX modeles_message_orga_statut_idx ON modeles_message (orga_id, statut_approbation)');
    }

    public function down(): void
    {
        Schema::dropIfExists('modeles_message');
        DB::statement('DROP TYPE IF EXISTS statut_approbation_modele');
        DB::statement('DROP TYPE IF EXISTS categorie_modele_message');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integrations_paiement', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orga_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('fournisseur', 50)->default('cinetpay');
            $table->text('api_key')->nullable();
            $table->string('site_id', 100)->nullable();
            $table->boolean('actif')->default(true);
            $table->timestampsTz();

            $table->unique(['orga_id', 'fournisseur']);
            $table->index('orga_id', 'idx_integrations_orga');
        });

        DB::statement("ALTER TABLE integrations_paiement ADD COLUMN mode environnement_enum NOT NULL DEFAULT 'test'");

        Schema::create('paiements_cinetpay', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orga_id')->constrained('organisations')->cascadeOnDelete();
            $table->foreignId('facture_id')->constrained('factures')->cascadeOnDelete();
            $table->foreignId('paiement_facture_id')->nullable()->constrained('paiements_facture')->nullOnDelete();
            $table->string('transaction_id', 255)->unique();
            $table->string('cinetpay_payment_id', 255)->nullable();
            $table->decimal('montant', 14, 2);
            $table->char('devise', 3)->default('XOF');
            $table->string('numero_telephone', 20)->nullable();
            $table->string('code_retour', 10)->nullable();
            $table->text('message_retour')->nullable();
            $table->jsonb('payload_notification')->nullable();
            $table->timestampTz('date_initiation')->useCurrent();
            $table->timestampTz('date_confirmation')->nullable();
            $table->timestampsTz();

            $table->index('facture_id', 'idx_paiements_cinetpay_facture');
        });

        DB::statement('ALTER TABLE paiements_cinetpay ADD COLUMN operateur mode_paiement_enum');
        DB::statement("ALTER TABLE paiements_cinetpay ADD COLUMN statut cinetpay_statut_enum NOT NULL DEFAULT 'initiee'");
        DB::statement('CREATE INDEX idx_paiements_cinetpay_statut ON paiements_cinetpay (statut)');
        DB::statement('ALTER TABLE paiements_cinetpay ADD CONSTRAINT paiements_cinetpay_montant_check CHECK (montant > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements_cinetpay');
        Schema::dropIfExists('integrations_paiement');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private function createEnumIfNotExists(string $typeName, array $values): void
    {
        $quoted = implode(', ', array_map(fn ($v) => "'".$v."'", $values));
        DB::statement(
            "DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '{$typeName}') THEN
                    CREATE TYPE {$typeName} AS ENUM ({$quoted});
                END IF;
            END $$;"
        );
    }

    public function up(): void
    {
        // Drop legacy enum types from the previous English schema (orphaned by migrate:fresh
        // after those migrations were removed — PostgreSQL keeps types when tables are dropped).
        foreach ([
            'plan_id',
            'membership_role',
            'subscription_status',
            'subscription_invoice_status',
            'document_kind',
            'catalog_kind',
            'pipeline_stage',
            'conversation_channel',
            'message_direction',
            'delivery_status',
        ] as $legacyType) {
            DB::statement("DROP TYPE IF EXISTS {$legacyType} CASCADE");
        }

        $this->createEnumIfNotExists('user_role', ['admin', 'agent']);
        $this->createEnumIfNotExists('client_categorie', ['prospect', 'qualifie', 'negociation', 'client', 'inactif']);
        $this->createEnumIfNotExists('produit_type', ['produit', 'service']);
        $this->createEnumIfNotExists('devis_statut', ['brouillon', 'envoye', 'accepte', 'refuse', 'expire', 'converti']);
        $this->createEnumIfNotExists('facture_statut', ['brouillon', 'envoyee', 'payee', 'partiellement_payee', 'impayee', 'en_retard', 'annulee']);
        $this->createEnumIfNotExists('mode_paiement_enum', ['cash', 'virement', 'carte', 'orange_money', 'mtn_money', 'moov_money', 'wave', 'cheque', 'autre']);
        $this->createEnumIfNotExists('abonnement_statut', ['essai', 'en_cours', 'expire', 'annule']);
        $this->createEnumIfNotExists('relance_canal_enum', ['email', 'sms', 'whatsapp']);
        $this->createEnumIfNotExists('relance_statut_enum', ['planifiee', 'envoyee', 'echouee', 'annulee']);
        $this->createEnumIfNotExists('depense_statut_enum', ['en_attente', 'validee', 'rejetee']);
        $this->createEnumIfNotExists('frequence_recurrence_enum', ['mensuelle', 'trimestrielle', 'semestrielle', 'annuelle']);
        $this->createEnumIfNotExists('environnement_enum', ['test', 'production']);
        $this->createEnumIfNotExists('cinetpay_statut_enum', ['initiee', 'en_attente', 'succes', 'echec', 'annulee', 'expiree']);
    }

    public function down(): void
    {
        foreach ([
            'cinetpay_statut_enum',
            'environnement_enum',
            'frequence_recurrence_enum',
            'depense_statut_enum',
            'relance_statut_enum',
            'relance_canal_enum',
            'abonnement_statut',
            'mode_paiement_enum',
            'facture_statut',
            'devis_statut',
            'produit_type',
            'client_categorie',
            'user_role',
        ] as $type) {
            DB::statement("DROP TYPE IF EXISTS {$type}");
        }
    }
};

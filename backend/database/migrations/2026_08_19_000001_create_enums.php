<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private function createEnumIfNotExists(string $typeName, array $values): void
    {
        $quoted = implode(', ', array_map(fn ($v) => "'" . $v . "'", $values));
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
        $this->createEnumIfNotExists('plan_id', ['free', 'pro']);
        $this->createEnumIfNotExists('membership_role', ['owner', 'admin', 'member']);
        $this->createEnumIfNotExists('subscription_status', ['trialing', 'active', 'past_due', 'canceled']);
        $this->createEnumIfNotExists('subscription_invoice_status', ['paid', 'open']);
        $this->createEnumIfNotExists('document_kind', ['quote', 'invoice', 'credit_note']);
        $this->createEnumIfNotExists('catalog_kind', ['service', 'product']);
        $this->createEnumIfNotExists('pipeline_stage', ['nouveau', 'qualifie', 'devis', 'negociation', 'gagne', 'perdu']);
        $this->createEnumIfNotExists('conversation_channel', ['whatsapp', 'messenger', 'instagram', 'tiktok']);
        $this->createEnumIfNotExists('message_direction', ['inbound', 'outbound']);
        $this->createEnumIfNotExists('delivery_status', ['success', 'failed', 'skipped', 'pending', 'sent', 'delivered', 'read']);
    }

    public function down(): void
    {
        DB::statement('DROP TYPE IF EXISTS delivery_status');
        DB::statement('DROP TYPE IF EXISTS message_direction');
        DB::statement('DROP TYPE IF EXISTS conversation_channel');
        DB::statement('DROP TYPE IF EXISTS pipeline_stage');
        DB::statement('DROP TYPE IF EXISTS catalog_kind');
        DB::statement('DROP TYPE IF EXISTS document_kind');
        DB::statement('DROP TYPE IF EXISTS subscription_invoice_status');
        DB::statement('DROP TYPE IF EXISTS subscription_status');
        DB::statement('DROP TYPE IF EXISTS membership_role');
        DB::statement('DROP TYPE IF EXISTS plan_id');
    }
};

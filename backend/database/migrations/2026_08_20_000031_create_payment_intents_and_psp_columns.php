<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_intents', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('document_id')->nullable()->constrained()->nullOnDelete();
            $table->text('purpose')->default('document');
            $table->text('plan_id')->nullable();
            $table->decimal('amount', 14, 2);
            $table->text('currency')->default('XOF');
            $table->text('provider')->default('cinetpay');
            $table->text('provider_transaction_id')->nullable()->unique();
            $table->text('checkout_url')->nullable();
            $table->text('status')->default('pending');
            $table->text('method_hint')->nullable();
            $table->text('customer_phone')->nullable();
            $table->text('idempotency_key')->unique();
            $table->jsonb('raw_payload')->nullable();
            $table->timestampTz('paid_at')->nullable();
            $table->timestampsTz();

            $table->index(['document_id', 'status'], 'payment_intents_document_status_idx');
            $table->index(['provider', 'provider_transaction_id'], 'payment_intents_provider_tx_idx');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->foreignUuid('payment_intent_id')
                ->nullable()
                ->constrained('payment_intents')
                ->nullOnDelete();
            $table->text('provider')->nullable();
            $table->text('provider_transaction_id')->nullable();
            $table->text('source')->default('manual');
        });

        DB::statement('
            CREATE UNIQUE INDEX payments_provider_tx_unique
            ON payments (provider, provider_transaction_id)
            WHERE provider_transaction_id IS NOT NULL
        ');

        Schema::table('organization_settings', function (Blueprint $table) {
            $table->text('psp_provider')->nullable();
            $table->text('psp_site_id')->nullable();
            $table->text('psp_api_key')->nullable();
            $table->text('psp_environment')->default('sandbox');
        });
    }

    public function down(): void
    {
        Schema::table('organization_settings', function (Blueprint $table) {
            $table->dropColumn([
                'psp_provider',
                'psp_site_id',
                'psp_api_key',
                'psp_environment',
            ]);
        });

        DB::statement('DROP INDEX IF EXISTS payments_provider_tx_unique');

        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['payment_intent_id']);
            $table->dropColumn([
                'payment_intent_id',
                'provider',
                'provider_transaction_id',
                'source',
            ]);
        });

        Schema::dropIfExists('payment_intents');
    }
};

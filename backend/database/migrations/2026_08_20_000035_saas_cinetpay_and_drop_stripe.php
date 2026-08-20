<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('payment_intents', 'purpose')) {
            Schema::table('payment_intents', function (Blueprint $table) {
                $table->text('purpose')->default('document');
                $table->text('plan_id')->nullable();
            });
        }

        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE payment_intents ALTER COLUMN document_id DROP NOT NULL');
        }

        Schema::table('payment_intents', function (Blueprint $table) {
            $table->index(['purpose', 'status'], 'payment_intents_purpose_status_idx');
        });

        if (! Schema::hasColumn('subscription_invoices', 'payment_intent_id')) {
            Schema::table('subscription_invoices', function (Blueprint $table) {
                $table->uuid('payment_intent_id')->nullable();
                $table->text('provider')->nullable();
                $table->text('provider_transaction_id')->nullable();
            });
        }

        if (Schema::hasColumn('subscription_invoices', 'stripe_invoice_id')) {
            if ($driver === 'pgsql') {
                DB::statement('ALTER TABLE subscription_invoices DROP CONSTRAINT IF EXISTS subscription_invoices_stripe_invoice_id_unique');
            }
            Schema::table('subscription_invoices', function (Blueprint $table) {
                $table->dropColumn('stripe_invoice_id');
            });
        }

        if (Schema::hasColumn('plans', 'stripe_price_id')) {
            Schema::table('plans', function (Blueprint $table) {
                $table->dropColumn('stripe_price_id');
            });
        }

        if (Schema::hasColumn('subscriptions', 'stripe_customer_id')) {
            Schema::table('subscriptions', function (Blueprint $table) {
                $table->dropColumn(['stripe_customer_id', 'stripe_subscription_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->text('stripe_price_id')->nullable();
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->text('stripe_customer_id')->nullable();
            $table->text('stripe_subscription_id')->nullable();
        });

        Schema::table('subscription_invoices', function (Blueprint $table) {
            $table->text('stripe_invoice_id')->nullable();
            $table->dropColumn(['payment_intent_id', 'provider', 'provider_transaction_id']);
        });

        Schema::table('payment_intents', function (Blueprint $table) {
            $table->dropIndex('payment_intents_purpose_status_idx');
            $table->dropColumn(['purpose', 'plan_id']);
        });
    }
};

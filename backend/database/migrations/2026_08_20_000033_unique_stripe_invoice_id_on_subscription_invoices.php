<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement(<<<'SQL'
                DELETE FROM subscription_invoices a
                USING subscription_invoices b
                WHERE a.stripe_invoice_id IS NOT NULL
                  AND a.stripe_invoice_id = b.stripe_invoice_id
                  AND a.ctid > b.ctid
            SQL);
        } else {
            // SQLite / others: delete duplicates keeping the lowest id
            $dupes = DB::table('subscription_invoices')
                ->select('stripe_invoice_id')
                ->whereNotNull('stripe_invoice_id')
                ->groupBy('stripe_invoice_id')
                ->havingRaw('count(*) > 1')
                ->pluck('stripe_invoice_id');

            foreach ($dupes as $stripeId) {
                $keepId = DB::table('subscription_invoices')
                    ->where('stripe_invoice_id', $stripeId)
                    ->orderBy('created_at')
                    ->value('id');

                DB::table('subscription_invoices')
                    ->where('stripe_invoice_id', $stripeId)
                    ->where('id', '!=', $keepId)
                    ->delete();
            }
        }

        Schema::table('subscription_invoices', function (Blueprint $table) {
            $table->unique('stripe_invoice_id');
        });
    }

    public function down(): void
    {
        Schema::table('subscription_invoices', function (Blueprint $table) {
            $table->dropUnique(['stripe_invoice_id']);
        });
    }
};

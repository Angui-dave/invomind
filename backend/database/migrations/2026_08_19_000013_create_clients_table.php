<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->text('name');
            $table->text('company')->default('');
            $table->text('email');
            $table->text('phone')->nullable();
            $table->text('address')->nullable();
            $table->text('city')->nullable();
            $table->text('postal_code')->nullable();
            $table->text('country')->nullable();
            $table->text('tax_id')->nullable();
            $table->text('currency')->nullable();
            $table->integer('payment_term_days')->nullable();
            $table->boolean('reminders_enabled')->default(true);
            $table->text('portal_token');
            $table->timestampsTz();

            $table->unique(['organization_id', 'portal_token'], 'clients_org_portal_token_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organization_settings', function (Blueprint $table) {
            $table->foreignUuid('organization_id')->primary()->constrained()->cascadeOnDelete();
            $table->text('company_name');
            $table->text('email');
            $table->text('phone')->default('');
            $table->text('address')->default('');
            $table->text('city')->default('');
            $table->text('postal_code')->default('');
            $table->text('country')->default('SN');
            $table->text('tax_id')->default('');
            $table->text('default_currency')->default('XOF');
            $table->text('default_tax_mode')->default('exclusive');
            $table->integer('default_tax_rate')->default(18);
            $table->text('bank_name')->default('');
            $table->text('iban')->default('');
            $table->text('bic')->default('');
            $table->text('qr_iban')->nullable();
            $table->text('twint_number')->nullable();
            $table->text('mobile_money_provider')->nullable();
            $table->text('mobile_money_number')->nullable();
            $table->text('legal_mentions')->default('');
            $table->boolean('reminders_enabled')->default(true);
            $table->jsonb('reminder_cadence')->default('["J-3","J+3","J+7","J+14"]');
            $table->boolean('payment_connected')->default(false);
            $table->jsonb('accepted_payment_methods')->default('["card","mobile_money","transfer"]');
            $table->timestampTz('updated_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_settings');
    }
};

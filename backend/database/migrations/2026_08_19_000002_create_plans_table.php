<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->string('id')->primary(); // plan_id enum used as text key
            $table->text('name');
            $table->integer('price')->default(0);
            $table->text('price_label');
            $table->text('description');
            $table->jsonb('features')->default('[]');
            $table->text('limit_label')->nullable();
            $table->boolean('highlighted')->default(false);
            $table->integer('max_invoices_per_month')->nullable();
            $table->integer('max_clients')->nullable();
            $table->boolean('auto_reminders')->default(false);
            $table->boolean('online_payments')->default(false);
            $table->boolean('pipeline')->default(false);
            $table->boolean('conversations')->default(false);
            $table->boolean('reports')->default(true);
            $table->text('stripe_price_id')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};

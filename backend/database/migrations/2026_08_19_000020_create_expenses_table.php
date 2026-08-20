<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->text('date');
            $table->text('description');
            $table->decimal('amount', 14, 2);
            $table->text('currency')->default('XOF');
            $table->uuid('category_id');
            $table->uuid('supplier_id')->nullable();
            $table->text('supplier_name')->nullable();
            $table->decimal('tax_rate', 6, 2)->default(0);
            $table->boolean('tax_deductible')->default(true);
            $table->decimal('tax_amount', 14, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('category_id')->references('id')->on('expense_categories')->restrictOnDelete();
            $table->foreign('supplier_id')->references('id')->on('suppliers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};

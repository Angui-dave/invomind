<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalog_items', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->text('name');
            $table->text('description')->default('');
            $table->decimal('unit_price', 14, 2);
            $table->text('currency')->default('XOF');
            $table->decimal('tax_rate', 6, 2)->default(0);
            $table->text('unit')->default('unité');
            $table->string('kind')->default('service'); // catalog_kind enum
            $table->timestampTz('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_items');
    }
};

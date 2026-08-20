<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->text('name');
            $table->text('company')->default('');
            $table->text('email')->default('');
            $table->text('phone')->nullable();
            $table->text('address')->nullable();
            $table->text('city')->nullable();
            $table->text('country')->nullable();
            $table->text('tax_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};

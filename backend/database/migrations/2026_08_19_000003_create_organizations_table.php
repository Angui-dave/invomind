<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->id(); // Clé primaire auto-incrémentée
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()')); // Unique, mais pas primaire
            $table->string('name');
            $table->string('slug')->unique();
            $table->foreignId('plan_id')->constrained('plans');
            $table->timestampsTz();

            $table->foreign('plan_id')->references('id')->on('plans')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};

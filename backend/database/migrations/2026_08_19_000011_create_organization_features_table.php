<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organization_features', function (Blueprint $table) {
            $table->foreignUuid('organization_id')->primary()->constrained()->cascadeOnDelete();
            $table->boolean('pipeline')->default(true);
            $table->boolean('conversations')->default(true);
            $table->boolean('expenses')->default(true);
            $table->boolean('catalog')->default(true);
            $table->boolean('reports')->default(true);
            $table->boolean('import_tool')->default(true);
            $table->timestampTz('updated_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_features');
    }
};

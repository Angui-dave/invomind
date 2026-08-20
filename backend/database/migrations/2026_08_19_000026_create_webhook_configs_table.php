<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhook_configs', function (Blueprint $table) {
            $table->foreignUuid('organization_id')->primary()->constrained()->cascadeOnDelete();
            $table->text('url')->default('');
            $table->text('secret')->default('');
            $table->boolean('enabled')->default(false);
            $table->timestampTz('updated_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_configs');
    }
};

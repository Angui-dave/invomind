<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organization_branding', function (Blueprint $table) {
            $table->foreignUuid('organization_id')->primary()->constrained()->cascadeOnDelete();
            $table->text('display_name')->nullable();
            $table->text('logo_url')->nullable();
            $table->text('primary_color')->default('#2563eb');
            $table->text('accent_color')->default('#10b981');
            $table->timestampTz('updated_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_branding');
    }
};

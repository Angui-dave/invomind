<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_attempts', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->text('conversation_id');
            $table->string('channel'); // conversation_channel enum
            $table->string('status'); // delivery_status enum
            $table->integer('http_status')->nullable();
            $table->text('error')->nullable();
            $table->timestampTz('attempted_at')->useCurrent();
            $table->integer('duration_ms')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_attempts');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('channel_connections', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->string('channel'); // conversation_channel enum
            $table->text('external_id');
            $table->text('display_name')->nullable();
            $table->text('metadata')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['channel', 'external_id'], 'channel_connections_channel_external_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('channel_connections');
    }
};

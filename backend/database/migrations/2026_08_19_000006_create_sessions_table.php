<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('api_sessions', function (Blueprint $table) {
            $table->string('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->text('token_hash')->unique();
            $table->timestampTz('expires_at');
            $table->timestampTz('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_sessions');

        // After 160000 rollback, api_sessions may have been renamed back to sessions.
        if (
            Schema::hasTable('sessions')
            && Schema::hasColumn('sessions', 'token_hash')
            && Schema::hasColumn('sessions', 'expires_at')
        ) {
            Schema::drop('sessions');
        }
    }
};

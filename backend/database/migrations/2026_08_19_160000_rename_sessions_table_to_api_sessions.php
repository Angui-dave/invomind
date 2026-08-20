<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('sessions') && ! Schema::hasTable('api_sessions')) {
            Schema::rename('sessions', 'api_sessions');
        }
    }

    public function down(): void
    {
        // No rename on rollback: 000006 drops api_sessions directly.
        // Renaming back to "sessions" leaves a FK on users and breaks users rollback.
    }
};

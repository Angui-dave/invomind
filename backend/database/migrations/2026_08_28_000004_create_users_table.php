<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('orga_id')->constrained('organisations')->cascadeOnDelete();
            $table->string('full_name', 255);
            $table->string('email', 255)->unique();
            $table->text('password_hash');
            $table->text('photo_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampTz('last_login_at')->nullable();
            $table->timestampTz('email_verified_at')->nullable();
            $table->timestampsTz();

            $table->index('orga_id', 'idx_users_orga');
        });

        DB::statement("ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'agent'");
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::table('memberships', function (Blueprint $table) {
            $table->timestampTz('disabled_at')->nullable();
        });

        Schema::table('plans', function (Blueprint $table) {
            $table->unsignedInteger('max_agents')->nullable();
        });

        DB::table('plans')->where('id', 'free')->update(['max_agents' => 0]);
        DB::table('plans')->where('id', 'pro')->update(['max_agents' => 3]);

        Schema::create('organization_invitations', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->text('email');
            $table->string('role');
            $table->text('token_hash');
            $table->foreignUuid('invited_by')->constrained('users')->restrictOnDelete();
            $table->timestampTz('expires_at');
            $table->timestampTz('accepted_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['organization_id', 'email']);
        });

        DB::statement('
            CREATE UNIQUE INDEX organization_invitations_pending_email
            ON organization_invitations (organization_id, email)
            WHERE accepted_at IS NULL
        ');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS organization_invitations_pending_email');
        Schema::dropIfExists('organization_invitations');
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn('max_agents');
        });
        Schema::table('memberships', function (Blueprint $table) {
            $table->dropColumn('disabled_at');
        });
        Schema::dropIfExists('password_reset_tokens');
    }
};

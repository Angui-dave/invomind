<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('memberships', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('role')->default('member'); // membership_role enum
            $table->timestampTz('created_at')->useCurrent();

            $table->unique(['organization_id', 'user_id'], 'memberships_org_user_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('memberships');
    }
};

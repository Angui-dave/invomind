<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->string('channel'); // conversation_channel enum
            $table->text('contact_name');
            $table->text('contact_handle');
            $table->text('thread_ref')->nullable();
            $table->text('avatar_initials')->nullable();
            $table->uuid('client_id')->nullable();
            $table->uuid('prospect_id')->nullable();
            $table->integer('unread_count')->default(0);
            $table->timestampTz('last_message_at')->useCurrent();
            $table->boolean('archived')->default(false);
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('client_id')->references('id')->on('clients')->nullOnDelete();
            $table->foreign('prospect_id')->references('id')->on('prospects')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};

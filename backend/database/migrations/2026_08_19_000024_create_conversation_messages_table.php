<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversation_messages', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('conversation_id')->constrained()->cascadeOnDelete();
            $table->string('direction'); // message_direction enum
            $table->text('body');
            $table->timestampTz('sent_at')->useCurrent();
            $table->string('status')->nullable(); // delivery_status enum
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversation_messages');
    }
};

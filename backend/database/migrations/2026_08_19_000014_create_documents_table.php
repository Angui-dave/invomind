<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->string('kind'); // document_kind enum
            $table->text('number');
            $table->uuid('client_id');
            $table->text('client_name');
            $table->text('status');
            $table->text('currency')->default('XOF');
            $table->text('tax_mode')->default('exclusive');
            $table->text('issue_date');
            $table->text('due_date');
            $table->decimal('total', 14, 2)->default(0);
            $table->decimal('subtotal_ht', 14, 2)->default(0);
            $table->decimal('tax_total', 14, 2)->default(0);
            $table->boolean('online_payment_enabled')->default(false);
            $table->text('paid_online_at')->nullable();
            $table->text('payment_method')->nullable();
            $table->boolean('reminders_enabled')->default(true);
            $table->text('portal_token')->unique();
            $table->uuid('source_document_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestampsTz();

            $table->foreign('client_id')->references('id')->on('clients')->restrictOnDelete();
            $table->unique(['organization_id', 'number'], 'documents_org_number_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};

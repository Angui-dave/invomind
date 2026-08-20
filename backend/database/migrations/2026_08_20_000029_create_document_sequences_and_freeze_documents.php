<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_sequences', function (Blueprint $table) {
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->string('kind');
            $table->integer('year');
            $table->unsignedInteger('last_number')->default(0);

            $table->primary(['organization_id', 'kind', 'year'], 'document_sequences_pk');
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->timestampTz('issued_at')->nullable();
            $table->foreignUuid('issued_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->boolean('frozen')->default(false);
            $table->text('pdf_disk_path')->nullable();
            $table->text('pdf_sha256')->nullable();
            $table->jsonb('snapshot_json')->nullable();
            $table->integer('fiscal_year')->nullable();
        });

        DB::statement('
            CREATE UNIQUE INDEX IF NOT EXISTS documents_org_kind_year_number_idx
            ON documents (organization_id, kind, fiscal_year, number)
            WHERE fiscal_year IS NOT NULL
        ');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS documents_org_kind_year_number_idx');

        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['issued_by_user_id']);
            $table->dropColumn([
                'issued_at',
                'issued_by_user_id',
                'frozen',
                'pdf_disk_path',
                'pdf_sha256',
                'snapshot_json',
                'fiscal_year',
            ]);
        });

        Schema::dropIfExists('document_sequences');
    }
};

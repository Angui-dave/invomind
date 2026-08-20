<?php

use App\Support\EmailTemplateCatalog;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outbound_deliveries', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('document_id')->constrained()->cascadeOnDelete();
            $table->text('channel');
            $table->text('event');
            $table->text('to_address');
            $table->text('subject')->nullable();
            $table->text('status')->default('queued');
            $table->text('provider_message_id')->nullable();
            $table->text('error')->nullable();
            $table->jsonb('payload_json')->nullable();
            $table->timestampTz('sent_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(
                ['organization_id', 'document_id', 'event'],
                'outbound_deliveries_org_doc_event_idx',
            );
            $table->index(['status', 'created_at'], 'outbound_deliveries_status_created_idx');
        });

        Schema::table('email_templates', function (Blueprint $table) {
            $table->text('channel')->default('email');
            $table->text('event')->nullable();
        });

        DB::statement("
            UPDATE email_templates
            SET channel = 'email',
                event = CASE milestone
                    WHEN 'J-3' THEN 'reminder_J-3'
                    WHEN 'J+3' THEN 'reminder_J+3'
                    WHEN 'J+7' THEN 'reminder_J+7'
                    WHEN 'J+14' THEN 'reminder_J+14'
                    ELSE milestone
                END
        ");

        DB::statement('ALTER TABLE email_templates ALTER COLUMN event SET NOT NULL');

        Schema::table('email_templates', function (Blueprint $table) {
            $table->unique(
                ['organization_id', 'channel', 'event'],
                'email_templates_org_channel_event_idx',
            );
            $table->dropColumn('milestone');
        });

        $this->seedMissingTemplates();

        Schema::table('document_reminders', function (Blueprint $table) {
            $table->timestampTz('scheduled_for')->nullable();
            $table->timestampTz('sent_at')->nullable();
            $table->foreignUuid('outbound_delivery_id')
                ->nullable()
                ->constrained('outbound_deliveries')
                ->nullOnDelete();
            $table->unique(['document_id', 'milestone'], 'document_reminders_document_milestone_idx');
        });

        DB::statement("
            UPDATE document_reminders
            SET scheduled_for = (date || ' 00:00:00+00')::timestamptz
            WHERE scheduled_for IS NULL AND date IS NOT NULL AND date <> ''
        ");
    }

    public function down(): void
    {
        Schema::table('document_reminders', function (Blueprint $table) {
            $table->dropUnique('document_reminders_document_milestone_idx');
            $table->dropForeign(['outbound_delivery_id']);
            $table->dropColumn(['scheduled_for', 'sent_at', 'outbound_delivery_id']);
        });

        Schema::table('email_templates', function (Blueprint $table) {
            $table->text('milestone')->nullable();
        });

        DB::statement("
            UPDATE email_templates
            SET milestone = CASE event
                WHEN 'reminder_J-3' THEN 'J-3'
                WHEN 'reminder_J+3' THEN 'J+3'
                WHEN 'reminder_J+7' THEN 'J+7'
                WHEN 'reminder_J+14' THEN 'J+14'
                ELSE event
            END
        ");

        Schema::table('email_templates', function (Blueprint $table) {
            $table->dropUnique('email_templates_org_channel_event_idx');
            $table->dropColumn(['channel', 'event']);
        });

        Schema::dropIfExists('outbound_deliveries');
    }

    private function seedMissingTemplates(): void
    {
        $orgIds = DB::table('organizations')->pluck('id');

        foreach ($orgIds as $orgId) {
            $existing = DB::table('email_templates')
                ->where('organization_id', $orgId)
                ->pluck('event')
                ->all();

            foreach (EmailTemplateCatalog::defaults() as $template) {
                if (in_array($template['event'], $existing, true)) {
                    continue;
                }

                DB::table('email_templates')->insert([
                    'id' => (string) Str::uuid(),
                    'organization_id' => $orgId,
                    'channel' => EmailTemplateCatalog::CHANNEL_EMAIL,
                    'event' => $template['event'],
                    'label' => $template['label'],
                    'subject' => $template['subject'],
                    'body' => $template['body'],
                    'updated_at' => now(),
                ]);
            }
        }
    }
};

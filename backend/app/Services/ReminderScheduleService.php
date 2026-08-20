<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentReminder;
use Carbon\Carbon;

class ReminderScheduleService
{
    public const OFFSETS = [
        'J-3' => -3,
        'J+3' => 3,
        'J+7' => 7,
        'J+14' => 14,
    ];

    /**
     * Create scheduled reminder rows at issue time. Idempotent per document.
     */
    public function scheduleForIssuedDocument(Document $document): void
    {
        if ($document->kind !== 'invoice' || ! $document->reminders_enabled) {
            return;
        }

        $document->loadMissing(['organization.plan', 'organization.settings', 'reminders']);

        if ($document->reminders->isNotEmpty()) {
            return;
        }

        $settings = $document->organization?->settings;
        $plan = $document->organization?->plan;

        if (! $settings?->reminders_enabled || ! $plan?->auto_reminders) {
            return;
        }

        $cadence = $settings->reminder_cadence ?: array_keys(self::OFFSETS);

        foreach ($cadence as $milestone) {
            if (! isset(self::OFFSETS[$milestone])) {
                continue;
            }

            $scheduledFor = Carbon::parse($document->due_date, 'UTC')
                ->startOfDay()
                ->addDays(self::OFFSETS[$milestone]);

            DocumentReminder::query()->create([
                'organization_id' => $document->organization_id,
                'document_id' => $document->id,
                'milestone' => $milestone,
                'state' => 'scheduled',
                'date' => $scheduledFor->toDateString(),
                'scheduled_for' => $scheduledFor,
            ]);
        }
    }
}

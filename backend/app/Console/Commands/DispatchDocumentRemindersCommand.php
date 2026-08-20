<?php

namespace App\Console\Commands;

use App\Jobs\SendReminderJob;
use App\Models\DocumentReminder;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('documents:dispatch-reminders')]
#[Description('Dispatche les relances e-mail échues (jalons J-3 / J+3 / J+7 / J+14).')]
class DispatchDocumentRemindersCommand extends Command
{
    public function handle(): int
    {
        $dispatched = 0;
        $disabled = 0;

        DocumentReminder::query()
            ->where('state', 'scheduled')
            ->where('scheduled_for', '<=', now())
            ->orderBy('id')
            ->eachById(function (DocumentReminder $reminder) use (&$dispatched, &$disabled): void {
                $reminder->load('document');
                $document = $reminder->document;
                if ($document === null) {
                    return;
                }

                if (in_array($document->status, ['paid', 'cancelled'], true)) {
                    $reminder->update(['state' => 'disabled']);
                    $disabled++;

                    return;
                }

                SendReminderJob::dispatch($document->organization_id, $reminder->id);
                $dispatched++;
            });

        $this->info("Relances dispatchées : {$dispatched}. Jalons désactivés (payé/annulé) : {$disabled}.");

        return self::SUCCESS;
    }
}

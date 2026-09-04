<?php

namespace App\Jobs;

use App\Enums\CanalMessagerie;
use App\Enums\ModeBoiteReception;
use App\Models\Inbox;
use App\Services\Messagerie\TemplateService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SyncWhatsAppTemplatesJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public ?int $inboxId = null) {}

    public function handle(TemplateService $templates): void
    {
        $query = Inbox::withoutGlobalScopes()
            ->where('canal', CanalMessagerie::Whatsapp->value)
            ->where('actif', true)
            ->where('mode', '!=', ModeBoiteReception::Fake->value);

        if ($this->inboxId) {
            $query->where('id', $this->inboxId);
        }

        foreach ($query->get() as $inbox) {
            try {
                $templates->syncFromMeta($inbox);
            } catch (\Throwable $e) {
                Log::warning('SyncWhatsAppTemplatesJob failed for inbox', [
                    'inbox_id' => $inbox->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}

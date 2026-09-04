<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DispatchDocumentRemindersCommand extends Command
{
    protected $signature = 'documents:dispatch-reminders';

    protected $description = 'Generate reminder rows for invoices due today (calls DB function)';

    public function handle(): int
    {
        DB::statement('SELECT generer_relances_du_jour()');
        $this->info('Relances du jour générées.');

        return self::SUCCESS;
    }
}

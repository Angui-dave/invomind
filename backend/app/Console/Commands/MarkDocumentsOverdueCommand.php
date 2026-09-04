<?php

namespace App\Console\Commands;

use App\Enums\FactureStatut;
use App\Models\Invoice;
use Illuminate\Console\Command;

class MarkDocumentsOverdueCommand extends Command
{
    protected $signature = 'documents:mark-overdue';

    protected $description = 'Mark unpaid invoices past due date as en_retard';

    public function handle(): int
    {
        $count = Invoice::withoutGlobalScopes()
            ->whereIn('statut', [
                FactureStatut::Envoyee,
                FactureStatut::Impayee,
                FactureStatut::PartiellementPayee,
            ])
            ->whereNotNull('date_echeance')
            ->whereDate('date_echeance', '<', now()->toDateString())
            ->update(['statut' => FactureStatut::EnRetard]);

        $this->info("Marked {$count} invoice(s) overdue.");

        return self::SUCCESS;
    }
}

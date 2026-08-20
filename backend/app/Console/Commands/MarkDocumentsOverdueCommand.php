<?php

namespace App\Console\Commands;

use App\Models\Document;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('documents:mark-overdue')]
#[Description('Passe en overdue les factures émises dont l’échéance est dépassée.')]
class MarkDocumentsOverdueCommand extends Command
{
    public function handle(): int
    {
        $today = now()->toDateString();

        $updated = Document::query()
            ->where('kind', 'invoice')
            ->whereIn('status', ['sent', 'partially_paid'])
            ->where('due_date', '<', $today)
            ->update(['status' => 'overdue']);

        $this->info("Factures passées en retard : {$updated}.");

        return self::SUCCESS;
    }
}

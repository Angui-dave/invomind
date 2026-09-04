<?php

namespace App\Console\Commands;

use App\Enums\AbonnementStatut;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Console\Command;

class ExpireSubscriptionsCommand extends Command
{
    protected $signature = 'subscriptions:expire';

    protected $description = 'Downgrade organizations whose subscription end date has passed';

    public function handle(): int
    {
        $gratuit = Plan::query()->where('code', 'gratuit')->first();
        if (! $gratuit) {
            $this->error('Plan gratuit manquant.');

            return self::FAILURE;
        }

        $count = Subscription::query()
            ->whereIn('statut', [AbonnementStatut::EnCours, AbonnementStatut::Essai])
            ->whereNotNull('date_fin')
            ->whereDate('date_fin', '<', now()->toDateString())
            ->update([
                'plan_id' => $gratuit->id,
                'statut' => AbonnementStatut::Expire,
            ]);

        $this->info("Expired {$count} subscription(s).");

        return self::SUCCESS;
    }
}

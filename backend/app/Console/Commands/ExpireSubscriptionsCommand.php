<?php

namespace App\Console\Commands;

use App\Services\SubscriptionBillingService;
use Illuminate\Console\Command;

class ExpireSubscriptionsCommand extends Command
{
    protected $signature = 'subscriptions:expire';

    protected $description = 'Downgrade organizations whose prepaid CinetPay period has ended';

    public function handle(SubscriptionBillingService $billing): int
    {
        $count = $billing->expireOverdue();
        $this->info("Expired {$count} subscription(s).");

        return self::SUCCESS;
    }
}

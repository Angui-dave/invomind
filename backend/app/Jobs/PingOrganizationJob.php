<?php

namespace App\Jobs;

use Illuminate\Support\Facades\Log;

/**
 * Smoke job for the database queue. Payload always carries organization_id.
 */
class PingOrganizationJob extends TenantAwareJob
{
    public function __construct(string $organizationId)
    {
        parent::__construct($organizationId);

        $this->afterCommit = false;
    }

    public function handle(): void
    {
        Log::info('invo.queue.ping', [
            'organization_id' => $this->organizationId,
        ]);
    }
}

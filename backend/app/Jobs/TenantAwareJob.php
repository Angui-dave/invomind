<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Defaults for every tenant-scoped job: 3 tries, backoff, timeout, uniqueness.
 */
abstract class TenantAwareJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [30, 60, 120];

    public int $timeout = 120;

    public int $uniqueFor = 3600;

    public function __construct(
        public readonly string $organizationId,
    ) {
        $this->afterCommit = true;
    }

    public function uniqueId(): string
    {
        return $this->organizationId;
    }
}

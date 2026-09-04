<?php

namespace App\Models\Concerns;

trait HasPublicUuid
{
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }
}

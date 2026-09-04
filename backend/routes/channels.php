<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['auth:sanctum']]);

Broadcast::channel('organisation.{organizationId}', function (User $user, int|string $organizationId) {
    return (int) $user->orga_id === (int) $organizationId && $user->is_active;
});

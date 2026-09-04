<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\User;

class OrganizationPolicy
{
    public function update(User $user, Organization $organization): bool
    {
        return $user->orga_id === $organization->id
            && $user->role === UserRole::Admin;
    }
}

<?php

namespace App\Policies;

use App\Models\Organization;
use App\Models\User;

class OrganizationPolicy
{
    public function manageSettings(User $user, Organization $org): bool
    {
        $role = request()->attributes->get('membership_role');
        return in_array($role, ['owner', 'admin'])
            && $org->id === request()->attributes->get('organization_id');
    }
}

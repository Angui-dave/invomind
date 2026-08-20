<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\User;

class ClientPolicy
{
    public function view(User $user, Client $client): bool
    {
        return $client->organization_id === request()->attributes->get('organization_id');
    }

    public function update(User $user, Client $client): bool
    {
        return $client->organization_id === request()->attributes->get('organization_id');
    }

    public function delete(User $user, Client $client): bool
    {
        return $client->organization_id === request()->attributes->get('organization_id');
    }
}

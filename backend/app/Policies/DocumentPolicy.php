<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;
use Illuminate\Http\Request;

class DocumentPolicy
{
    public function view(User $user, Document $document): bool
    {
        return $this->belongsToTenant($document);
    }

    public function update(User $user, Document $document): bool
    {
        return $this->belongsToTenant($document);
    }

    public function delete(User $user, Document $document): bool
    {
        return $this->belongsToTenant($document) && $document->status === 'draft';
    }

    private function belongsToTenant(Document $document): bool
    {
        return $document->organization_id === request()->attributes->get('organization_id');
    }
}

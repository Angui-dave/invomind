<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    public function view(User $user, Document $document): bool
    {
        return $this->belongsToTenant($document);
    }

    public function update(User $user, Document $document): bool
    {
        return $this->belongsToTenant($document) && ! $document->frozen;
    }

    public function issue(User $user, Document $document): bool
    {
        return $this->belongsToTenant($document);
    }

    public function send(User $user, Document $document): bool
    {
        return $this->belongsToTenant($document);
    }

    public function updateStatus(User $user, Document $document): bool
    {
        return $this->belongsToTenant($document)
            && $document->kind === 'quote'
            && in_array($document->status, ['sent', 'accepted', 'refused', 'expired'], true);
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

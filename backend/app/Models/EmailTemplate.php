<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use App\Support\EmailTemplateCatalog;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    use BelongsToOrganization, HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'organization_id', 'channel', 'event', 'label', 'subject', 'body', 'updated_at',
    ];

    protected $appends = ['milestone'];

    public function getMilestoneAttribute(): string
    {
        return EmailTemplateCatalog::milestoneFromEvent((string) $this->event)
            ?? (string) $this->event;
    }
}

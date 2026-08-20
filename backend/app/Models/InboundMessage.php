<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;

class InboundMessage extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    use BelongsToOrganization;

    protected $fillable = [
        'id', 'organization_id', 'channel', 'handle', 'body',
        'sent_at', 'contact_name', 'thread_ref',
    ];
}

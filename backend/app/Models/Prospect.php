<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Prospect extends Model
{
    use HasUuids, BelongsToOrganization;

    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'organization_id', 'name', 'company', 'estimated_value',
        'stage', 'last_interaction_at',
    ];

    protected function casts(): array
    {
        return ['estimated_value' => 'decimal:2'];
    }
}

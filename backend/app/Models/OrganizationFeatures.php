<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationFeatures extends Model
{
    protected $table = 'organization_features';
    protected $primaryKey = 'organization_id';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'organization_id', 'pipeline', 'conversations', 'expenses',
        'catalog', 'reports', 'import_tool',
    ];

    protected function casts(): array
    {
        return [
            'pipeline' => 'boolean',
            'conversations' => 'boolean',
            'expenses' => 'boolean',
            'catalog' => 'boolean',
            'reports' => 'boolean',
            'import_tool' => 'boolean',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}

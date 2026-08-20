<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasUuids, BelongsToOrganization;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'organization_id', 'name', 'company', 'email', 'phone', 'address',
        'city', 'postal_code', 'country', 'tax_id', 'currency',
        'payment_term_days', 'reminders_enabled', 'portal_token',
    ];

    protected function casts(): array
    {
        return ['reminders_enabled' => 'boolean'];
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }
}

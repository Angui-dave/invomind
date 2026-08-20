<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SubscriptionInvoice extends Model
{
    use HasUuids, BelongsToOrganization;

    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'organization_id', 'date', 'description', 'amount',
        'currency', 'status', 'stripe_invoice_id',
    ];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2'];
    }
}

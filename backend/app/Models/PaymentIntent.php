<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PaymentIntent extends Model
{
    use BelongsToOrganization, HasUuids;

    public const STATUS_PENDING = 'pending';

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_SUCCEEDED = 'succeeded';

    public const STATUS_FAILED = 'failed';

    public const STATUS_EXPIRED = 'expired';

    public const STATUS_CANCELLED = 'cancelled';

    public const PROVIDER_CINETPAY = 'cinetpay';

    public const PURPOSE_DOCUMENT = 'document';

    public const PURPOSE_SAAS_PLAN = 'saas_plan';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'organization_id',
        'document_id',
        'purpose',
        'plan_id',
        'amount',
        'currency',
        'provider',
        'provider_transaction_id',
        'checkout_url',
        'status',
        'method_hint',
        'customer_phone',
        'idempotency_key',
        'raw_payload',
        'paid_at',
    ];

    protected $hidden = [
        'raw_payload',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'raw_payload' => 'array',
            'paid_at' => 'datetime',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function isOpen(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_PROCESSING], true);
    }

    public function isSaasPlan(): bool
    {
        return $this->purpose === self::PURPOSE_SAAS_PLAN;
    }
}

<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use BelongsToOrganization, HasUuids;

    public const SOURCE_MANUAL = 'manual';

    public const SOURCE_PORTAL_PSP = 'portal_psp';

    public const SOURCE_IMPORT = 'import';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'organization_id', 'document_id', 'document_number', 'client_id',
        'client_name', 'amount', 'currency', 'method', 'paid_at',
        'reference', 'notes', 'payment_intent_id', 'provider',
        'provider_transaction_id', 'source',
    ];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2'];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function paymentIntent(): BelongsTo
    {
        return $this->belongsTo(PaymentIntent::class);
    }
}

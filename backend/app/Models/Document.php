<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Document extends Model
{
    use BelongsToOrganization, HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'organization_id', 'kind', 'number', 'client_id', 'client_name',
        'status', 'currency', 'tax_mode', 'issue_date', 'due_date',
        'total', 'subtotal_ht', 'tax_total', 'online_payment_enabled',
        'paid_online_at', 'payment_method', 'reminders_enabled',
        'portal_token', 'source_document_id', 'notes',
        'issued_at', 'issued_by_user_id', 'frozen',
        'pdf_disk_path', 'pdf_sha256', 'snapshot_json', 'fiscal_year',
    ];

    protected $appends = ['pdf_ready'];

    protected function casts(): array
    {
        return [
            'total' => 'decimal:2',
            'subtotal_ht' => 'decimal:2',
            'tax_total' => 'decimal:2',
            'online_payment_enabled' => 'boolean',
            'reminders_enabled' => 'boolean',
            'frozen' => 'boolean',
            'issued_at' => 'datetime',
            'snapshot_json' => 'array',
            'fiscal_year' => 'integer',
        ];
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isFrozen(): bool
    {
        return (bool) $this->frozen;
    }

    public function getPdfReadyAttribute(): bool
    {
        return filled($this->pdf_sha256);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by_user_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(DocumentLine::class)->orderBy('position');
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(DocumentReminder::class);
    }

    public function outboundDeliveries(): HasMany
    {
        return $this->hasMany(OutboundDelivery::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function paymentIntents(): HasMany
    {
        return $this->hasMany(PaymentIntent::class);
    }

    public function sourceDocument(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'source_document_id');
    }
}

<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Document extends Model
{
    use HasUuids, BelongsToOrganization;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'organization_id', 'kind', 'number', 'client_id', 'client_name',
        'status', 'currency', 'tax_mode', 'issue_date', 'due_date',
        'total', 'subtotal_ht', 'tax_total', 'online_payment_enabled',
        'paid_online_at', 'payment_method', 'reminders_enabled',
        'portal_token', 'source_document_id', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'total' => 'decimal:2',
            'subtotal_ht' => 'decimal:2',
            'tax_total' => 'decimal:2',
            'online_payment_enabled' => 'boolean',
            'reminders_enabled' => 'boolean',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(DocumentLine::class)->orderBy('position');
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(DocumentReminder::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function sourceDocument(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'source_document_id');
    }
}

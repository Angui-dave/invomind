<?php

namespace App\Models;

use App\Enums\DevisStatut;
use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Quote extends Model
{
    use BelongsToOrganization, HasPublicUuid, SoftDeletes;

    protected $table = 'devis';

    protected $fillable = [
        'orga_id',
        'user_id',
        'client_id',
        'numero',
        'date_creation',
        'date_validite',
        'statut',
        'devise',
        'sous_total',
        'remise_montant',
        'montant_tva',
        'montant_total',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'statut' => DevisStatut::class,
            'date_creation' => 'datetime',
            'date_validite' => 'date',
            'sous_total' => 'decimal:2',
            'remise_montant' => 'decimal:2',
            'montant_tva' => 'decimal:2',
            'montant_total' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(QuoteLine::class, 'devis_id')->orderBy('ordre');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'devis_id');
    }
}

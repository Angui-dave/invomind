<?php

namespace App\Models;

use App\Enums\FactureStatut;
use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use BelongsToOrganization, HasPublicUuid, SoftDeletes;

    protected $table = 'factures';

    protected $fillable = [
        'orga_id',
        'user_id',
        'client_id',
        'devis_id',
        'numero',
        'date_creation',
        'date_echeance',
        'statut',
        'devise',
        'sous_total',
        'remise_montant',
        'montant_tva',
        'montant_total',
        'montant_paye',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'statut' => FactureStatut::class,
            'date_creation' => 'datetime',
            'date_echeance' => 'date',
            'sous_total' => 'decimal:2',
            'remise_montant' => 'decimal:2',
            'montant_tva' => 'decimal:2',
            'montant_total' => 'decimal:2',
            'montant_paye' => 'decimal:2',
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

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class, 'devis_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(InvoiceLine::class, 'facture_id')->orderBy('ordre');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(InvoicePayment::class, 'facture_id');
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(InvoiceReminder::class, 'facture_id');
    }

    public function cinetPayPayments(): HasMany
    {
        return $this->hasMany(CinetPayPayment::class, 'facture_id');
    }
}

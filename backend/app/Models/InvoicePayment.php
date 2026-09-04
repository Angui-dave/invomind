<?php

namespace App\Models;

use App\Enums\ModePaiement;
use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoicePayment extends Model
{
    use BelongsToOrganization;

    public $timestamps = false;

    const CREATED_AT = 'created_at';

    protected $table = 'paiements_facture';

    protected $fillable = [
        'orga_id',
        'facture_id',
        'client_id',
        'montant',
        'devise',
        'date_paiement',
        'mode_paiement',
        'reference',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
            'date_paiement' => 'datetime',
            'mode_paiement' => ModePaiement::class,
            'created_at' => 'datetime',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'facture_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }
}

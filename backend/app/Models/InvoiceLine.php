<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceLine extends Model
{
    public $timestamps = false;

    protected $table = 'facture_lignes';

    protected $fillable = [
        'facture_id',
        'produit_id',
        'designation',
        'quantite',
        'prix_unitaire',
        'taux_tva',
        'remise_pourcentage',
        'montant_ht',
        'ordre',
    ];

    protected function casts(): array
    {
        return [
            'quantite' => 'decimal:2',
            'prix_unitaire' => 'decimal:2',
            'taux_tva' => 'decimal:2',
            'remise_pourcentage' => 'decimal:2',
            'montant_ht' => 'decimal:2',
            'ordre' => 'integer',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'facture_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(ProductService::class, 'produit_id');
    }
}

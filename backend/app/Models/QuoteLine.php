<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuoteLine extends Model
{
    public $timestamps = false;

    protected $table = 'devis_lignes';

    protected $fillable = [
        'devis_id',
        'produit_id',
        'designation',
        'quantite',
        'prix_unitaire',
        'taux_tva',
        'remise_pourcentage',
        'montant_ht',
        'montant_tva',
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
            'montant_tva' => 'decimal:2',
            'ordre' => 'integer',
        ];
    }

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class, 'devis_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(ProductService::class, 'produit_id');
    }
}

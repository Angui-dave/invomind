<?php

namespace App\Models;

use App\Enums\ProduitType;
use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductService extends Model
{
    use BelongsToOrganization, SoftDeletes;

    protected $table = 'produits_services';

    protected $fillable = [
        'orga_id',
        'user_id',
        'reference',
        'name',
        'description',
        'type',
        'prix_unitaire',
        'devise',
        'taux_tva',
        'unite',
        'quantite_stock',
        'gere_stock',
        'actif',
    ];

    protected function casts(): array
    {
        return [
            'type' => ProduitType::class,
            'prix_unitaire' => 'decimal:2',
            'taux_tva' => 'decimal:2',
            'quantite_stock' => 'integer',
            'gere_stock' => 'boolean',
            'actif' => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

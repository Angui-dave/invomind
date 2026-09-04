<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    public $timestamps = false;

    protected $table = 'plans_abonnement';

    protected $fillable = [
        'code',
        'nom',
        'prix_mensuel',
        'prix_annuel',
        'devise',
        'limite_factures_mois',
        'limite_utilisateurs',
        'limite_clients',
        'fonctionnalites',
        'actif',
    ];

    protected function casts(): array
    {
        return [
            'prix_mensuel' => 'decimal:2',
            'prix_annuel' => 'decimal:2',
            'fonctionnalites' => 'array',
            'actif' => 'boolean',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'plan_id');
    }
}

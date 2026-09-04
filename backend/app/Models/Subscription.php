<?php

namespace App\Models;

use App\Enums\AbonnementStatut;
use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    use BelongsToOrganization;

    protected $table = 'abonnements';

    protected $fillable = [
        'orga_id',
        'plan_id',
        'date_debut',
        'date_fin',
        'renouvellement_auto',
        'statut',
    ];

    protected function casts(): array
    {
        return [
            'date_debut' => 'date',
            'date_fin' => 'date',
            'renouvellement_auto' => 'boolean',
            'statut' => AbonnementStatut::class,
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'plan_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SubscriptionPayment::class, 'abonnement_id');
    }
}

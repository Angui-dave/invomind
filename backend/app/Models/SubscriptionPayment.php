<?php

namespace App\Models;

use App\Enums\ModePaiement;
use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionPayment extends Model
{
    use BelongsToOrganization;

    public $timestamps = false;

    const CREATED_AT = 'created_at';

    protected $table = 'paiements_abonnement';

    protected $fillable = [
        'orga_id',
        'abonnement_id',
        'montant',
        'devise',
        'mode_paiement',
        'reference_payement',
        'date_payement',
        'statut',
    ];

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
            'mode_paiement' => ModePaiement::class,
            'date_payement' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class, 'abonnement_id');
    }
}

<?php

namespace App\Models;

use App\Enums\Environnement;
use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;

class PaymentIntegration extends Model
{
    use BelongsToOrganization;

    protected $table = 'integrations_paiement';

    protected $fillable = [
        'orga_id',
        'fournisseur',
        'api_key',
        'site_id',
        'mode',
        'actif',
    ];

    protected $hidden = ['api_key'];

    protected function casts(): array
    {
        return [
            'mode' => Environnement::class,
            'actif' => 'boolean',
        ];
    }
}

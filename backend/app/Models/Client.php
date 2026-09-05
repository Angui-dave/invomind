<?php

namespace App\Models;

use App\Enums\ClientCategorie;
use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use BelongsToOrganization, HasPublicUuid, SoftDeletes;

    protected $table = 'clients';

    protected $fillable = [
        'orga_id',
        'user_id',
        'name_company',
        'email',
        'phone',
        'adresse',
        'ville',
        'code_postal',
        'country',
        'devise',
        'delai_paiement_jours',
        'numero_fiscal',
        'categorie_client',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'categorie_client' => ClientCategorie::class,
            'delai_paiement_jours' => 'integer',
        ];
    }

    public function commercial(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class, 'client_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'client_id');
    }
}

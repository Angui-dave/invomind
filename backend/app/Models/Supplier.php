<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use BelongsToOrganization, HasPublicUuid, SoftDeletes;

    protected $table = 'fournisseurs';

    protected $fillable = [
        'orga_id',
        'user_id',
        'name_company',
        'contact',
        'email',
        'phone',
        'adresse',
        'ville',
        'country',
        'numero_fiscal',
        'notes',
    ];

    public function commercial(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class, 'fournisseur_id');
    }
}

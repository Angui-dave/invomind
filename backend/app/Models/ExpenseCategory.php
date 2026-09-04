<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganizationOrGlobal;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExpenseCategory extends Model
{
    use BelongsToOrganizationOrGlobal;

    public $timestamps = false;

    const CREATED_AT = 'created_at';

    protected $table = 'categories_depense';

    protected $fillable = [
        'orga_id',
        'nom',
        'description',
        'couleur',
        'actif',
    ];

    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class, 'categorie_id');
    }
}

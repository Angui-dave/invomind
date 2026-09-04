<?php

namespace App\Models;

use App\Enums\DepenseStatut;
use App\Enums\FrequenceRecurrence;
use App\Enums\ModePaiement;
use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Expense extends Model
{
    use BelongsToOrganization, SoftDeletes;

    protected $table = 'depenses';

    protected $fillable = [
        'orga_id',
        'user_id',
        'categorie_id',
        'fournisseur_id',
        'libelle',
        'description',
        'fournisseur',
        'reference',
        'montant_ht',
        'taux_tva',
        'montant_tva',
        'devise',
        'date_depense',
        'mode_paiement',
        'piece_jointe_url',
        'recurrente',
        'frequence_recurrence',
        'statut',
        'valide_par',
        'date_validation',
    ];

    protected function casts(): array
    {
        return [
            'montant_ht' => 'decimal:2',
            'taux_tva' => 'decimal:2',
            'montant_tva' => 'decimal:2',
            'montant_ttc' => 'decimal:2',
            'date_depense' => 'date',
            'mode_paiement' => ModePaiement::class,
            'recurrente' => 'boolean',
            'frequence_recurrence' => FrequenceRecurrence::class,
            'statut' => DepenseStatut::class,
            'date_validation' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class, 'categorie_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'fournisseur_id');
    }

    public function validatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'valide_par');
    }
}

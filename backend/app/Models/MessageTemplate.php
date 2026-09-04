<?php

namespace App\Models;

use App\Enums\CategorieModeleMessage;
use App\Enums\StatutApprobationModele;
use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageTemplate extends Model
{
    use BelongsToOrganization, HasPublicUuid;

    protected $table = 'modeles_message';

    protected $fillable = [
        'orga_id',
        'boite_reception_id',
        'nom',
        'langue',
        'categorie',
        'composants',
        'statut_approbation',
        'id_externe_meta',
        'corps_apercu',
    ];

    protected function casts(): array
    {
        return [
            'categorie' => CategorieModeleMessage::class,
            'statut_approbation' => StatutApprobationModele::class,
            'composants' => 'array',
        ];
    }

    public function inbox(): BelongsTo
    {
        return $this->belongsTo(Inbox::class, 'boite_reception_id');
    }
}

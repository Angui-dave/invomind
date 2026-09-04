<?php

namespace App\Models;

use App\Enums\CanalMessagerie;
use App\Enums\ModeBoiteReception;
use App\Enums\StatutConnexionBoite;
use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Inbox extends Model
{
    use BelongsToOrganization, HasPublicUuid, SoftDeletes;

    protected $table = 'boites_reception';

    protected $fillable = [
        'orga_id',
        'canal',
        'nom',
        'identifiants',
        'mode',
        'statut_connexion',
        'derniere_erreur',
        'actif',
    ];

    protected $hidden = [
        'identifiants',
    ];

    protected function casts(): array
    {
        return [
            'canal' => CanalMessagerie::class,
            'mode' => ModeBoiteReception::class,
            'statut_connexion' => StatutConnexionBoite::class,
            'identifiants' => 'encrypted:array',
            'actif' => 'boolean',
        ];
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'boite_reception_id');
    }

    public function contactLinks(): HasMany
    {
        return $this->hasMany(ContactInbox::class, 'boite_reception_id');
    }

    public function templates(): HasMany
    {
        return $this->hasMany(MessageTemplate::class, 'boite_reception_id');
    }
}

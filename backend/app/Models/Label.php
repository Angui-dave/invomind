<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Label extends Model
{
    use BelongsToOrganization, HasPublicUuid;

    protected $table = 'etiquettes';

    protected $fillable = [
        'orga_id',
        'nom',
        'couleur',
    ];

    public function conversations(): BelongsToMany
    {
        return $this->belongsToMany(Conversation::class, 'conversation_etiquette', 'etiquette_id', 'conversation_id');
    }
}

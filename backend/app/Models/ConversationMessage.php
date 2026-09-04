<?php

namespace App\Models;

use App\Enums\DirectionMessage;
use App\Enums\StatutLivraisonMessage;
use App\Enums\TypeContenuMessage;
use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConversationMessage extends Model
{
    use BelongsToOrganization, HasPublicUuid;

    protected $table = 'conversation_messages';

    protected $fillable = [
        'orga_id',
        'conversation_id',
        'boite_reception_id',
        'direction',
        'type_contenu',
        'contenu',
        'url_media',
        'id_externe',
        'statut_livraison',
        'erreur',
        'expediteur_agent_id',
        'envoye_at',
    ];

    protected function casts(): array
    {
        return [
            'direction' => DirectionMessage::class,
            'type_contenu' => TypeContenuMessage::class,
            'statut_livraison' => StatutLivraisonMessage::class,
            'envoye_at' => 'datetime',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }

    public function inbox(): BelongsTo
    {
        return $this->belongsTo(Inbox::class, 'boite_reception_id');
    }

    public function senderAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'expediteur_agent_id');
    }
}

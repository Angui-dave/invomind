<?php

namespace App\Models;

use App\Enums\StatutConversation;
use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    use BelongsToOrganization, HasPublicUuid;

    protected $table = 'conversations';

    protected $fillable = [
        'orga_id',
        'boite_reception_id',
        'contact_id',
        'statut',
        'agent_id',
        'derniere_activite_at',
        'non_lus_count',
        'archivee',
    ];

    protected function casts(): array
    {
        return [
            'statut' => StatutConversation::class,
            'derniere_activite_at' => 'datetime',
            'non_lus_count' => 'integer',
            'archivee' => 'boolean',
        ];
    }

    public function inbox(): BelongsTo
    {
        return $this->belongsTo(Inbox::class, 'boite_reception_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(MessagingContact::class, 'contact_id');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ConversationMessage::class, 'conversation_id');
    }

    public function labels(): BelongsToMany
    {
        return $this->belongsToMany(Label::class, 'conversation_etiquette', 'conversation_id', 'etiquette_id');
    }
}

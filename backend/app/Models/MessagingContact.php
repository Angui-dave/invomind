<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MessagingContact extends Model
{
    use BelongsToOrganization, HasPublicUuid;

    protected $table = 'contacts_messagerie';

    protected $fillable = [
        'orga_id',
        'nom_affichage',
        'client_id',
        'avatar_url',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function inboxLinks(): HasMany
    {
        return $this->hasMany(ContactInbox::class, 'contact_id');
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'contact_id');
    }
}

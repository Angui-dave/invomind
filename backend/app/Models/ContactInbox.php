<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactInbox extends Model
{
    protected $table = 'contacts_boite_reception';

    protected $fillable = [
        'contact_id',
        'boite_reception_id',
        'identifiant_externe',
        'donnees_brutes',
    ];

    protected function casts(): array
    {
        return [
            'donnees_brutes' => 'array',
        ];
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(MessagingContact::class, 'contact_id');
    }

    public function inbox(): BelongsTo
    {
        return $this->belongsTo(Inbox::class, 'boite_reception_id');
    }
}

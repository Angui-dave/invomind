<?php

namespace App\Models;

use App\Enums\RelanceCanal;
use App\Enums\RelanceStatut;
use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceReminder extends Model
{
    use BelongsToOrganization;

    public $timestamps = false;

    const CREATED_AT = 'created_at';

    protected $table = 'relances_facture';

    protected $fillable = [
        'orga_id',
        'facture_id',
        'regle_id',
        'date_prevue',
        'statut',
        'canal',
        'destinataire',
        'message_envoye',
        'date_envoi',
        'tentative_count',
        'derniere_erreur',
    ];

    protected function casts(): array
    {
        return [
            'date_prevue' => 'date',
            'statut' => RelanceStatut::class,
            'canal' => RelanceCanal::class,
            'date_envoi' => 'datetime',
            'tentative_count' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'facture_id');
    }

    public function rule(): BelongsTo
    {
        return $this->belongsTo(ReminderRule::class, 'regle_id');
    }
}

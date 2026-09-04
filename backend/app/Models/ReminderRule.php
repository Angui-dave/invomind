<?php

namespace App\Models;

use App\Enums\RelanceCanal;
use App\Models\Concerns\BelongsToOrganizationOrGlobal;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReminderRule extends Model
{
    use BelongsToOrganizationOrGlobal;

    protected $table = 'regles_relance';

    protected $fillable = [
        'orga_id',
        'nom',
        'decalage_jours',
        'canal',
        'objet_message',
        'template_message',
        'actif',
    ];

    protected function casts(): array
    {
        return [
            'decalage_jours' => 'integer',
            'canal' => RelanceCanal::class,
            'actif' => 'boolean',
        ];
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(InvoiceReminder::class, 'regle_id');
    }
}

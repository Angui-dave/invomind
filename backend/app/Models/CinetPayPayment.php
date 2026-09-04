<?php

namespace App\Models;

use App\Enums\CinetPayStatut;
use App\Enums\ModePaiement;
use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CinetPayPayment extends Model
{
    use BelongsToOrganization;

    protected $table = 'paiements_cinetpay';

    protected $fillable = [
        'orga_id',
        'facture_id',
        'paiement_facture_id',
        'transaction_id',
        'cinetpay_payment_id',
        'montant',
        'devise',
        'operateur',
        'numero_telephone',
        'statut',
        'code_retour',
        'message_retour',
        'payload_notification',
        'date_initiation',
        'date_confirmation',
    ];

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
            'operateur' => ModePaiement::class,
            'statut' => CinetPayStatut::class,
            'payload_notification' => 'array',
            'date_initiation' => 'datetime',
            'date_confirmation' => 'datetime',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'facture_id');
    }

    public function invoicePayment(): BelongsTo
    {
        return $this->belongsTo(InvoicePayment::class, 'paiement_facture_id');
    }
}

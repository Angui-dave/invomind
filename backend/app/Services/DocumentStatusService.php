<?php

namespace App\Services;

use App\Enums\DevisStatut;
use App\Enums\FactureStatut;
use Illuminate\Validation\ValidationException;

class DocumentStatusService
{
    /** @var array<string, list<FactureStatut>> */
    private const INVOICE_TRANSITIONS = [
        'brouillon' => [FactureStatut::Envoyee, FactureStatut::Annulee],
        'envoyee' => [FactureStatut::Impayee, FactureStatut::EnRetard, FactureStatut::Annulee],
        'impayee' => [FactureStatut::Envoyee, FactureStatut::EnRetard, FactureStatut::Annulee],
        'partiellement_payee' => [FactureStatut::EnRetard, FactureStatut::Annulee],
        'en_retard' => [FactureStatut::Impayee, FactureStatut::Annulee],
        'payee' => [],
        'annulee' => [],
    ];

    /** @var array<string, list<DevisStatut>> */
    private const QUOTE_TRANSITIONS = [
        'brouillon' => [DevisStatut::Envoye, DevisStatut::Refuse],
        'envoye' => [DevisStatut::Accepte, DevisStatut::Refuse, DevisStatut::Expire],
        'accepte' => [],
        'refuse' => [],
        'expire' => [],
        'converti' => [],
    ];

    public function assertInvoiceTransition(FactureStatut|string $from, FactureStatut $to): void
    {
        $fromValue = $from instanceof FactureStatut ? $from->value : $from;
        $allowed = self::INVOICE_TRANSITIONS[$fromValue] ?? [];

        foreach ($allowed as $status) {
            if ($status === $to) {
                return;
            }
        }

        throw ValidationException::withMessages([
            'statut' => "Transition de statut interdite ({$fromValue} → {$to->value}).",
        ]);
    }

    public function assertQuoteTransition(DevisStatut|string $from, DevisStatut $to): void
    {
        $fromValue = $from instanceof DevisStatut ? $from->value : $from;
        $allowed = self::QUOTE_TRANSITIONS[$fromValue] ?? [];

        foreach ($allowed as $status) {
            if ($status === $to) {
                return;
            }
        }

        throw ValidationException::withMessages([
            'statut' => "Transition de statut interdite ({$fromValue} → {$to->value}).",
        ]);
    }
}

<?php

namespace App\Enums;

enum FactureStatut: string
{
    case Brouillon = 'brouillon';
    case Envoyee = 'envoyee';
    case Payee = 'payee';
    case PartiellementPayee = 'partiellement_payee';
    case Impayee = 'impayee';
    case EnRetard = 'en_retard';
    case Annulee = 'annulee';
}

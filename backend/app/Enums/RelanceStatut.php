<?php

namespace App\Enums;

enum RelanceStatut: string
{
    case Planifiee = 'planifiee';
    case Envoyee = 'envoyee';
    case Echouee = 'echouee';
    case Annulee = 'annulee';
}

<?php

namespace App\Enums;

enum StatutApprobationModele: string
{
    case Brouillon = 'brouillon';
    case Soumis = 'soumis';
    case Approuve = 'approuve';
    case Rejete = 'rejete';
}

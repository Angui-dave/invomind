<?php

namespace App\Enums;

enum DevisStatut: string
{
    case Brouillon = 'brouillon';
    case Envoye = 'envoye';
    case Accepte = 'accepte';
    case Refuse = 'refuse';
    case Expire = 'expire';
    case Converti = 'converti';
}

<?php

namespace App\Enums;

enum StatutLivraisonMessage: string
{
    case EnAttente = 'en_attente';
    case Envoye = 'envoye';
    case Livre = 'livre';
    case Lu = 'lu';
    case Echec = 'echec';
}

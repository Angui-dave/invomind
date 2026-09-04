<?php

namespace App\Enums;

enum CinetPayStatut: string
{
    case Initiee = 'initiee';
    case EnAttente = 'en_attente';
    case Succes = 'succes';
    case Echec = 'echec';
    case Annulee = 'annulee';
    case Expiree = 'expiree';
}

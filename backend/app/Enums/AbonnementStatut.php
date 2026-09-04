<?php

namespace App\Enums;

enum AbonnementStatut: string
{
    case Essai = 'essai';
    case EnCours = 'en_cours';
    case Expire = 'expire';
    case Annule = 'annule';
}

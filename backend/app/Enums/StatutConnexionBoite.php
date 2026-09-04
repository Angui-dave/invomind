<?php

namespace App\Enums;

enum StatutConnexionBoite: string
{
    case Connectee = 'connectee';
    case Erreur = 'erreur';
    case Desactivee = 'desactivee';
}

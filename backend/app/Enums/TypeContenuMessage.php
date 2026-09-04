<?php

namespace App\Enums;

enum TypeContenuMessage: string
{
    case Texte = 'texte';
    case Image = 'image';
    case Fichier = 'fichier';
    case Audio = 'audio';
    case Video = 'video';
    case Modele = 'modele';
}

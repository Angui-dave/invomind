<?php

namespace App\Enums;

enum StatutConversation: string
{
    case Ouverte = 'ouverte';
    case EnAttente = 'en_attente';
    case Resolue = 'resolue';
}

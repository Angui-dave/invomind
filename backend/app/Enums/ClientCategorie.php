<?php

namespace App\Enums;

enum ClientCategorie: string
{
    case Prospect = 'prospect';
    case Qualifie = 'qualifie';
    case Negociation = 'negociation';
    case Client = 'client';
    case Inactif = 'inactif';
}

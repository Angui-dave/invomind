<?php

namespace App\Enums;

enum DepenseStatut: string
{
    case EnAttente = 'en_attente';
    case Validee = 'validee';
    case Rejetee = 'rejetee';
}

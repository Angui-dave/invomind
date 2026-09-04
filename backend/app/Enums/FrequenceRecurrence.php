<?php

namespace App\Enums;

enum FrequenceRecurrence: string
{
    case Mensuelle = 'mensuelle';
    case Trimestrielle = 'trimestrielle';
    case Semestrielle = 'semestrielle';
    case Annuelle = 'annuelle';
}

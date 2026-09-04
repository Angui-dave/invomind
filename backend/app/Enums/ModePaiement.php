<?php

namespace App\Enums;

enum ModePaiement: string
{
    case Cash = 'cash';
    case Virement = 'virement';
    case Carte = 'carte';
    case OrangeMoney = 'orange_money';
    case MtnMoney = 'mtn_money';
    case MoovMoney = 'moov_money';
    case Wave = 'wave';
    case Cheque = 'cheque';
    case Autre = 'autre';
}

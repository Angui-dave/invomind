<?php

namespace App\Enums;

enum RelanceCanal: string
{
    case Email = 'email';
    case Sms = 'sms';
    case Whatsapp = 'whatsapp';
}

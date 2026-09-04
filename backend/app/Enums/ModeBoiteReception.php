<?php

namespace App\Enums;

enum ModeBoiteReception: string
{
    case Fake = 'fake';
    case Sandbox = 'sandbox';
    case Production = 'production';
}

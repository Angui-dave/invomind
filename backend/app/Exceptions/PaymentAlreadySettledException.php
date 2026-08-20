<?php

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

class PaymentAlreadySettledException extends HttpException
{
    public function __construct(string $message = 'Cette facture est déjà réglée.')
    {
        parent::__construct(409, $message);
    }
}

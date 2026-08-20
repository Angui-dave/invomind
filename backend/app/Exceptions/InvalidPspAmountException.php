<?php

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

class InvalidPspAmountException extends HttpException
{
    public function __construct(string $message = 'Le montant du webhook ne correspond pas à l’intention de paiement.')
    {
        parent::__construct(422, $message);
    }
}

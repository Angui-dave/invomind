<?php

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

class PspCheckoutException extends HttpException
{
    public function __construct(string $message = 'Le prestataire de paiement est indisponible.')
    {
        parent::__construct(502, $message);
    }
}

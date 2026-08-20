<?php

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

class DocumentFrozenException extends HttpException
{
    public function __construct()
    {
        parent::__construct(
            409,
            'Ce document est émis et ne peut plus être modifié.',
        );
    }
}

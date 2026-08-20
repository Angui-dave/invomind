<?php

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

class DocumentNotIssuableException extends HttpException
{
    public function __construct(string $message = 'Ce document ne peut pas être émis.')
    {
        parent::__construct(422, $message);
    }
}

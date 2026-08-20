<?php

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

class DocumentPdfNotReadyException extends HttpException
{
    public function __construct(string $message = 'Le PDF ne peut être généré que pour un document émis et figé.')
    {
        parent::__construct(409, $message);
    }
}

<?php

namespace App\Services\Messagerie\Dto;

final class ResultatEnvoiDto
{
    public function __construct(
        public readonly bool $success,
        public readonly ?string $idExterne = null,
        public readonly ?string $erreur = null,
    ) {}
}

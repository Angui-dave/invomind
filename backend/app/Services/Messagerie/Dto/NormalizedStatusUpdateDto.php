<?php

namespace App\Services\Messagerie\Dto;

readonly class NormalizedStatusUpdateDto
{
    public function __construct(
        public string $canal,
        public string $inboxExternalId,
        public string $messageExternalId,
        /** sent|delivered|read|failed */
        public string $statut,
        public ?\DateTimeInterface $timestamp = null,
        public ?string $erreur = null,
    ) {}
}

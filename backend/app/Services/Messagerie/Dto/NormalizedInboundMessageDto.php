<?php

namespace App\Services\Messagerie\Dto;

final class NormalizedInboundMessageDto
{
    /**
     * @param  array<string, mixed>|null  $raw
     */
    public function __construct(
        public readonly string $canal,
        public readonly string $inboxExternalId,
        public readonly string $contactExternalId,
        public readonly string $messageExternalId,
        public readonly string $contenu,
        public readonly string $typeContenu = 'texte',
        public readonly ?string $urlMedia = null,
        public readonly ?string $contactName = null,
        public readonly ?\DateTimeInterface $envoyeAt = null,
        public readonly ?array $raw = null,
    ) {}
}

<?php

namespace App\Jobs;

use App\Models\Document;
use App\Services\DocumentPdfService;

class GenerateDocumentPdfJob extends TenantAwareJob
{
    public int $timeout = 180;

    public function __construct(
        string $organizationId,
        public readonly string $documentId,
    ) {
        parent::__construct($organizationId);
    }

    public function uniqueId(): string
    {
        return $this->organizationId.':'.$this->documentId;
    }

    public function handle(DocumentPdfService $pdfs): void
    {
        $document = Document::query()
            ->where('organization_id', $this->organizationId)
            ->where('id', $this->documentId)
            ->firstOrFail();

        $pdfs->render($document);
    }
}

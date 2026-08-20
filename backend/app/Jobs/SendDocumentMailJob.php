<?php

namespace App\Jobs;

use App\Mail\DocumentSentMail;
use App\Models\Document;
use App\Models\EmailTemplate;
use App\Models\OutboundDelivery;
use App\Services\DocumentPdfService;
use App\Services\EmailTemplateRenderer;
use App\Support\EmailTemplateCatalog;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class SendDocumentMailJob extends TenantAwareJob
{
    public int $uniqueFor = 30;

    public function __construct(
        string $organizationId,
        public readonly string $documentId,
    ) {
        parent::__construct($organizationId);

        $this->afterCommit = false;
    }

    public function uniqueId(): string
    {
        return $this->organizationId.':send:'.$this->documentId;
    }

    public function handle(DocumentPdfService $pdfs, EmailTemplateRenderer $renderer): void
    {
        $document = Document::query()
            ->where('organization_id', $this->organizationId)
            ->where('id', $this->documentId)
            ->with(['client', 'organization.settings'])
            ->firstOrFail();

        $event = $document->kind === 'quote' ? 'quote_sent' : 'document_sent';
        $to = $this->recipient($document);

        $relative = $pdfs->render($document);
        $absolute = Storage::disk('documents')->path($relative);
        $filename = ($document->number ?: 'document').'.pdf';

        $variables = $renderer->variablesForDocument($document->fresh());
        $template = EmailTemplate::query()
            ->where('organization_id', $document->organization_id)
            ->where('channel', EmailTemplateCatalog::CHANNEL_EMAIL)
            ->where('event', $event)
            ->first();

        $subject = $renderer->interpolate($template?->subject ?? 'Document {{numero}}', $variables);
        $body = $renderer->interpolate($template?->body ?? "Bonjour {{client}},\n\n{{lien_paiement}}\n\n{{societe}}", $variables);

        $delivery = OutboundDelivery::query()->create([
            'organization_id' => $document->organization_id,
            'document_id' => $document->id,
            'channel' => EmailTemplateCatalog::CHANNEL_EMAIL,
            'event' => $event,
            'to_address' => $to,
            'subject' => $subject,
            'status' => 'queued',
            'payload_json' => $variables,
        ]);

        try {
            Mail::to($to)->send(new DocumentSentMail(
                $document,
                $subject,
                $body,
                $absolute,
                $filename,
            ));

            $delivery->update([
                'status' => 'sent',
                'sent_at' => now(),
            ]);
        } catch (Throwable $e) {
            $delivery->update([
                'status' => 'failed',
                'error' => mb_substr($e->getMessage(), 0, 2000),
            ]);

            throw $e;
        }
    }

    private function recipient(Document $document): string
    {
        $email = $document->snapshot_json['client']['email']
            ?? $document->client?->email
            ?? null;

        if (! filled($email)) {
            throw new RuntimeException('Le client n’a pas d’adresse e-mail.');
        }

        return (string) $email;
    }
}

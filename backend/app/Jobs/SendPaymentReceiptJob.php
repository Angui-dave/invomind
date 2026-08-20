<?php

namespace App\Jobs;

use App\Mail\DocumentSentMail;
use App\Models\EmailTemplate;
use App\Models\OutboundDelivery;
use App\Models\Payment;
use App\Services\DocumentPdfService;
use App\Services\EmailTemplateRenderer;
use App\Support\EmailTemplateCatalog;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Throwable;

class SendPaymentReceiptJob extends TenantAwareJob
{
    public function __construct(
        string $organizationId,
        public readonly string $paymentId,
    ) {
        parent::__construct($organizationId);

        $this->afterCommit = false;
    }

    public function uniqueId(): string
    {
        return $this->organizationId.':receipt:'.$this->paymentId;
    }

    public function handle(DocumentPdfService $pdfs, EmailTemplateRenderer $renderer): void
    {
        $payment = Payment::query()
            ->where('organization_id', $this->organizationId)
            ->where('id', $this->paymentId)
            ->with(['document.client', 'document.organization.settings'])
            ->firstOrFail();

        $document = $payment->document;
        if ($document === null) {
            return;
        }

        $to = $document->snapshot_json['client']['email']
            ?? $document->client?->email
            ?? null;

        if (! filled($to)) {
            return;
        }

        $relative = $pdfs->renderReceipt($payment);
        $absolute = Storage::disk('documents')->path($relative);
        $filename = 'recu-'.($document->number ?: $payment->id).'.pdf';

        $variables = $renderer->variablesForDocument($document);
        $template = EmailTemplate::query()
            ->where('organization_id', $document->organization_id)
            ->where('channel', EmailTemplateCatalog::CHANNEL_EMAIL)
            ->where('event', 'payment_receipt')
            ->first();

        $subject = $renderer->interpolate($template?->subject ?? 'Reçu — facture {{numero}} {{montant}}', $variables);
        $body = $renderer->interpolate(
            $template?->body ?? "Bonjour {{client}},\n\nNous confirmons la réception de {{montant}}.\n\n{{societe}}",
            $variables,
        );

        $delivery = OutboundDelivery::query()->create([
            'organization_id' => $document->organization_id,
            'document_id' => $document->id,
            'channel' => EmailTemplateCatalog::CHANNEL_EMAIL,
            'event' => 'payment_receipt',
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
}

<?php

namespace App\Jobs;

use App\Mail\DocumentSentMail;
use App\Models\Document;
use App\Models\DocumentReminder;
use App\Models\EmailTemplate;
use App\Models\OutboundDelivery;
use App\Services\DocumentPdfService;
use App\Services\EmailTemplateRenderer;
use App\Services\EntitlementService;
use App\Support\EmailTemplateCatalog;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Throwable;

class SendReminderJob extends TenantAwareJob
{
    public const ELIGIBLE_STATUSES = ['sent', 'partially_paid', 'overdue'];

    public function __construct(
        string $organizationId,
        public readonly string $reminderId,
    ) {
        parent::__construct($organizationId);

        $this->afterCommit = false;
    }

    public function uniqueId(): string
    {
        return $this->organizationId.':reminder:'.$this->reminderId;
    }

    public function handle(
        DocumentPdfService $pdfs,
        EmailTemplateRenderer $renderer,
        EntitlementService $entitlements,
    ): void {
        $reminder = DocumentReminder::query()
            ->where('organization_id', $this->organizationId)
            ->where('id', $this->reminderId)
            ->firstOrFail();

        if ($reminder->state !== 'scheduled') {
            return;
        }

        $document = Document::query()
            ->where('organization_id', $this->organizationId)
            ->where('id', $reminder->document_id)
            ->with(['client', 'organization.settings', 'organization.plan'])
            ->firstOrFail();

        $event = EmailTemplateCatalog::eventFromKey($reminder->milestone);

        if ($this->alreadySent($document->id, $event)) {
            $reminder->update([
                'state' => 'sent',
                'sent_at' => $reminder->sent_at ?? now(),
            ]);

            return;
        }

        if ($this->shouldSkip($document, $entitlements)) {
            $this->markSkipped($reminder, $document, $event);

            return;
        }

        $to = $this->recipient($document);
        if ($to === null) {
            $this->markSkipped($reminder, $document, $event, 'Le client n’a pas d’adresse e-mail.');

            return;
        }

        $relative = $pdfs->render($document);
        $absolute = Storage::disk('documents')->path($relative);
        $filename = ($document->number ?: 'document').'.pdf';

        $variables = $renderer->variablesForDocument($document);
        $template = EmailTemplate::query()
            ->where('organization_id', $document->organization_id)
            ->where('channel', EmailTemplateCatalog::CHANNEL_EMAIL)
            ->where('event', $event)
            ->first();

        $subject = $renderer->interpolate($template?->subject ?? 'Relance {{numero}}', $variables);
        $body = $renderer->interpolate(
            $template?->body ?? "Bonjour {{client}},\n\n{{lien_paiement}}\n\n{{societe}}",
            $variables,
        );

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

            $reminder->update([
                'state' => 'sent',
                'sent_at' => now(),
                'outbound_delivery_id' => $delivery->id,
            ]);
        } catch (Throwable $e) {
            $delivery->update([
                'status' => 'failed',
                'error' => mb_substr($e->getMessage(), 0, 2000),
            ]);

            throw $e;
        }
    }

    private function shouldSkip(Document $document, EntitlementService $entitlements): bool
    {
        if (in_array($document->status, ['paid', 'cancelled'], true)) {
            return true;
        }

        if (! $document->reminders_enabled) {
            return true;
        }

        if (! in_array($document->status, self::ELIGIBLE_STATUSES, true)) {
            return true;
        }

        if (! $entitlements->canAutoRemind($document->organization_id)) {
            return true;
        }

        return ! $document->organization?->settings?->reminders_enabled;
    }

    private function markSkipped(
        DocumentReminder $reminder,
        Document $document,
        string $event,
        ?string $reason = null,
    ): void {
        $reminder->refresh();
        if ($reminder->state !== 'scheduled') {
            return;
        }

        $delivery = OutboundDelivery::query()->create([
            'organization_id' => $document->organization_id,
            'document_id' => $document->id,
            'channel' => EmailTemplateCatalog::CHANNEL_EMAIL,
            'event' => $event,
            'to_address' => $this->recipient($document) ?? 'n/a',
            'subject' => null,
            'status' => 'skipped',
            'error' => $reason,
            'payload_json' => ['reason' => $reason],
        ]);

        $reminder->update([
            'state' => 'disabled',
            'outbound_delivery_id' => $delivery->id,
        ]);
    }

    private function alreadySent(string $documentId, string $event): bool
    {
        return OutboundDelivery::query()
            ->where('document_id', $documentId)
            ->where('event', $event)
            ->where('status', 'sent')
            ->exists();
    }

    private function recipient(Document $document): ?string
    {
        $email = $document->snapshot_json['client']['email']
            ?? $document->client?->email
            ?? null;

        return filled($email) ? (string) $email : null;
    }
}

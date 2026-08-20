<?php

namespace App\Services;

use App\Exceptions\DocumentNotIssuableException;
use App\Jobs\GenerateDocumentPdfJob;
use App\Models\Document;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DocumentLifecycleService
{
    public function __construct(
        private DocumentNumberingService $numbering,
        private ReminderScheduleService $reminders,
    ) {}

    /**
     * Issue a draft: allocate a definitive number, freeze the piece, snapshot totals.
     * Idempotent: a frozen document is returned unchanged (number preserved).
     */
    public function issue(Document $document, ?User $user = null): Document
    {
        return DB::transaction(function () use ($document, $user) {
            /** @var Document $doc */
            $doc = Document::query()
                ->where('id', $document->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($doc->frozen) {
                if (blank($doc->pdf_sha256)) {
                    GenerateDocumentPdfJob::dispatch($doc->organization_id, $doc->id);
                }

                return $doc->load(['lines', 'reminders']);
            }

            if ($doc->status !== 'draft') {
                throw new DocumentNotIssuableException(
                    'Seuls les brouillons peuvent être émis.',
                );
            }

            $doc->loadMissing(['lines', 'client', 'organization.settings', 'organization.branding']);

            if ($doc->lines->isEmpty()) {
                throw new DocumentNotIssuableException(
                    'Ajoutez au moins une ligne avant d’émettre le document.',
                );
            }

            $year = $this->fiscalYear($doc);
            $number = $this->numbering->allocate($doc->organization_id, $doc->kind, $year);
            $status = $this->issuedStatus($doc->kind);

            $doc->number = $number;
            $doc->fiscal_year = $year;
            $doc->status = $status;
            $doc->frozen = true;
            $doc->issued_at = now();
            $doc->issued_by_user_id = $user?->id;
            $doc->save();

            $doc->snapshot_json = $this->buildSnapshot($doc->fresh([
                'lines',
                'client',
                'organization.settings',
                'organization.branding',
            ]));
            $doc->save();

            $this->reminders->scheduleForIssuedDocument($doc->fresh([
                'organization.plan',
                'organization.settings',
                'reminders',
            ]));

            GenerateDocumentPdfJob::dispatch($doc->organization_id, $doc->id);

            return $doc->fresh(['lines', 'reminders']);
        });
    }

    public function issuedStatus(string $kind): string
    {
        return $kind === 'credit_note' ? 'issued' : 'sent';
    }

    public function fiscalYear(Document $document): int
    {
        $year = (int) substr((string) $document->issue_date, 0, 4);

        return $year > 1999 ? $year : (int) now()->year;
    }

    /**
     * @return array<string, mixed>
     */
    public function buildSnapshot(Document $doc): array
    {
        $settings = $doc->organization?->settings;
        $branding = $doc->organization?->branding;
        $client = $doc->client;

        return [
            'captured_at' => now()->toIso8601String(),
            'organization' => [
                'id' => $doc->organization_id,
                'name' => $settings?->company_name ?? $doc->organization?->name,
                'email' => $settings?->email,
                'phone' => $settings?->phone,
                'address' => $settings?->address,
                'city' => $settings?->city,
                'postal_code' => $settings?->postal_code,
                'country' => $settings?->country,
                'tax_id' => $settings?->tax_id,
                'legal_mentions' => $settings?->legal_mentions,
                'bank_name' => $settings?->bank_name,
                'iban' => $settings?->iban,
                'bic' => $settings?->bic,
                'mobile_money_provider' => $settings?->mobile_money_provider,
                'mobile_money_number' => $settings?->mobile_money_number,
            ],
            'branding' => [
                'display_name' => $branding?->display_name,
                'logo_url' => $branding?->logo_url,
                'primary_color' => $branding?->primary_color,
                'accent_color' => $branding?->accent_color,
            ],
            'client' => [
                'id' => $client?->id,
                'name' => $client?->name ?? $doc->client_name,
                'company' => $client?->company,
                'email' => $client?->email,
                'phone' => $client?->phone,
                'address' => $client?->address,
                'city' => $client?->city,
                'postal_code' => $client?->postal_code,
                'country' => $client?->country,
                'tax_id' => $client?->tax_id,
            ],
            'document' => [
                'id' => $doc->id,
                'kind' => $doc->kind,
                'number' => $doc->number,
                'status' => $doc->status,
                'currency' => $doc->currency,
                'tax_mode' => $doc->tax_mode,
                'issue_date' => $doc->issue_date,
                'due_date' => $doc->due_date,
                'total' => (string) $doc->total,
                'subtotal_ht' => (string) $doc->subtotal_ht,
                'tax_total' => (string) $doc->tax_total,
                'notes' => $doc->notes,
                'fiscal_year' => $doc->fiscal_year,
                'portal_token' => $doc->portal_token,
                'online_payment_enabled' => $doc->online_payment_enabled,
            ],
            'lines' => $doc->lines->map(fn ($line) => [
                'id' => $line->id,
                'description' => $line->description,
                'quantity' => (string) $line->quantity,
                'unit_price' => (string) $line->unit_price,
                'tax_rate' => (string) $line->tax_rate,
                'discount_percent' => $line->discount_percent !== null ? (string) $line->discount_percent : null,
                'position' => $line->position,
            ])->values()->all(),
        ];
    }
}

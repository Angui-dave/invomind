<?php

namespace App\Services;

use App\Exceptions\InvalidPspAmountException;
use App\Models\Document;
use App\Models\DocumentReminder;
use App\Models\Payment;
use App\Models\PaymentIntent;
use Illuminate\Support\Facades\DB;

class DocumentPaymentService
{
    public function outstandingBalance(Document $document): string
    {
        $paid = Payment::query()
            ->where('document_id', $document->id)
            ->sum('amount');

        $credited = Document::query()
            ->where('source_document_id', $document->id)
            ->where('kind', 'credit_note')
            ->where('status', 'applied')
            ->sum('total');

        $remaining = bcsub(
            bcsub((string) $document->total, (string) $paid, 2),
            (string) $credited,
            2,
        );

        return bccomp($remaining, '0', 2) > 0 ? $remaining : '0.00';
    }

    public function recordManual(Document $document, array $data): Payment
    {
        return DB::transaction(function () use ($document, $data) {
            $payment = Payment::query()->create([
                'organization_id' => $document->organization_id,
                'document_id' => $document->id,
                'document_number' => $document->number,
                'client_id' => $document->client_id,
                'client_name' => $document->client_name,
                'amount' => $data['amount'],
                'currency' => $data['currency'] ?? $document->currency,
                'method' => $data['method'],
                'paid_at' => $data['paid_at'],
                'reference' => $data['reference'] ?? null,
                'notes' => $data['notes'] ?? null,
                'source' => Payment::SOURCE_MANUAL,
                'provider' => 'manual',
            ]);

            $this->syncDocumentStatus($document);

            return $payment;
        });
    }

    /**
     * Idempotent settlement from a PSP webhook / notification.
     */
    public function applySucceededWebhook(
        string $provider,
        string $providerTransactionId,
        string $amount,
        array $payload,
        ?string $intentId = null,
    ): Payment {
        return DB::transaction(function () use ($provider, $providerTransactionId, $amount, $payload, $intentId) {
            $existing = Payment::query()
                ->where('provider', $provider)
                ->where('provider_transaction_id', $providerTransactionId)
                ->lockForUpdate()
                ->first();

            if ($existing) {
                return $existing;
            }

            $intent = $this->lockIntent($provider, $providerTransactionId, $intentId);

            if ($intent->status === PaymentIntent::STATUS_SUCCEEDED) {
                return Payment::query()
                    ->where('payment_intent_id', $intent->id)
                    ->firstOrFail();
            }

            if (bccomp((string) $intent->amount, $amount, 2) !== 0) {
                throw new InvalidPspAmountException;
            }

            $intent->update([
                'provider' => $provider,
                'provider_transaction_id' => $providerTransactionId,
                'status' => PaymentIntent::STATUS_SUCCEEDED,
                'raw_payload' => $payload,
                'paid_at' => now(),
            ]);

            $document = Document::query()
                ->where('id', $intent->document_id)
                ->lockForUpdate()
                ->firstOrFail();

            $payment = Payment::query()->create([
                'organization_id' => $intent->organization_id,
                'document_id' => $document->id,
                'document_number' => $document->number,
                'client_id' => $document->client_id,
                'client_name' => $document->client_name,
                'amount' => $intent->amount,
                'currency' => $intent->currency,
                'method' => $this->methodFromHint($intent->method_hint),
                'paid_at' => now()->toDateString(),
                'reference' => $providerTransactionId,
                'payment_intent_id' => $intent->id,
                'provider' => $provider,
                'provider_transaction_id' => $providerTransactionId,
                'source' => Payment::SOURCE_PORTAL_PSP,
            ]);

            $this->syncDocumentStatus($document);

            return $payment;
        });
    }

    public function syncDocumentStatus(Document $document): void
    {
        if (in_array($document->status, ['draft', 'cancelled'], true) || $document->kind !== 'invoice') {
            return;
        }

        $outstanding = $this->outstandingBalance($document->fresh());

        if (bccomp($outstanding, '0', 2) === 0) {
            $document->update([
                'status' => 'paid',
                'paid_online_at' => $document->paid_online_at ?? now()->toIso8601String(),
            ]);
            $this->stopReminders($document);

            return;
        }

        $paid = Payment::query()->where('document_id', $document->id)->sum('amount');
        if (bccomp((string) $paid, '0', 2) > 0) {
            $document->update(['status' => 'partially_paid']);
        }
    }

    private function lockIntent(
        string $provider,
        string $providerTransactionId,
        ?string $intentId,
    ): PaymentIntent {
        return PaymentIntent::query()
            ->where('provider', $provider)
            ->where(function ($q) use ($providerTransactionId, $intentId) {
                $q->where('provider_transaction_id', $providerTransactionId);

                // Intent id is a UUID; only compare against id when the PSP id is UUID-shaped.
                if ($this->isUuid($providerTransactionId)) {
                    $q->orWhere('id', $providerTransactionId);
                }

                if (
                    $intentId
                    && $intentId === $providerTransactionId
                    && $this->isUuid($intentId)
                ) {
                    $q->orWhere('id', $intentId);
                }
            })
            ->lockForUpdate()
            ->firstOrFail();
    }

    private function isUuid(string $value): bool
    {
        return (bool) preg_match(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
            $value,
        );
    }

    private function methodFromHint(?string $hint): string
    {
        return match ($hint) {
            'card' => 'card',
            'transfer' => 'transfer',
            default => 'mobile_money',
        };
    }

    private function stopReminders(Document $document): void
    {
        DocumentReminder::query()
            ->where('document_id', $document->id)
            ->where('state', 'scheduled')
            ->update(['state' => 'disabled']);
    }
}

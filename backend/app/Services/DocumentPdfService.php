<?php

namespace App\Services;

use App\Exceptions\DocumentPdfNotReadyException;
use App\Models\Document;
use App\Models\Payment;
use App\Support\Money;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class DocumentPdfService
{
    public function __construct(
        private DocumentComputeService $compute,
        private EmvQrService $emv,
    ) {}

    /**
     * Render the frozen document PDF. Returns the relative path on the documents disk.
     */
    public function render(Document $document): string
    {
        $this->assertReady($document);

        $fingerprint = $this->fingerprint($document->snapshot_json);
        $path = $this->path($document);

        if ($this->isFresh($document, $path, $fingerprint)) {
            return $path;
        }

        $bytes = $this->pdfBytes('pdf.document', $this->documentViewData($document));
        $this->store($document, $path, $fingerprint, $bytes);

        return $path;
    }

    public function stream(Document $document): Response
    {
        if (
            ! $document->frozen
            || blank($document->pdf_sha256)
            || blank($document->pdf_disk_path)
            || ! Storage::disk('documents')->exists($document->pdf_disk_path)
        ) {
            throw new DocumentPdfNotReadyException('Le PDF n’est pas encore disponible.');
        }

        $filename = ($document->number ?: 'document').'.pdf';
        $contents = Storage::disk('documents')->get($document->pdf_disk_path);

        return response($contents, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
            'Content-Length' => (string) strlen($contents),
        ]);
    }

    public function html(Document $document): string
    {
        $this->assertReady($document);

        return view('pdf.document', $this->documentViewData($document))->render();
    }

    public function renderReceipt(Payment $payment): string
    {
        $document = $payment->document()->firstOrFail();
        $this->assertReady($document);

        $path = $payment->organization_id.'/receipts/'.$payment->id.'.pdf';
        $bytes = $this->pdfBytes('pdf.receipt', $this->receiptViewData($payment, $document));

        Storage::disk('documents')->put($path, $bytes);

        return $path;
    }

    public function streamReceipt(Payment $payment): Response
    {
        $document = $payment->relationLoaded('document')
            ? $payment->document
            : $payment->document()->firstOrFail();

        $path = $this->renderReceipt($payment);
        $filename = 'recu-'.($document->number ?: 'paiement').'.pdf';
        $contents = Storage::disk('documents')->get($path);

        return response($contents, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
            'Content-Length' => (string) strlen($contents),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function documentViewData(Document $document): array
    {
        $snapshot = $document->snapshot_json ?? [];
        $org = $snapshot['organization'] ?? [];
        $client = $snapshot['client'] ?? [];
        $branding = $snapshot['branding'] ?? [];
        $meta = $snapshot['document'] ?? [];
        $rawLines = $snapshot['lines'] ?? [];
        $kind = $meta['kind'] ?? $document->kind;
        $currency = $meta['currency'] ?? $document->currency;
        $taxMode = $meta['tax_mode'] ?? $document->tax_mode;

        $computed = $this->compute->computeDetailed($rawLines, $taxMode);

        $qrSvg = null;
        $qrLabel = null;
        $provider = $org['mobile_money_provider'] ?? null;
        $phone = $org['mobile_money_number'] ?? $org['phone'] ?? null;

        if ($kind === 'invoice' && filled($provider) && filled($phone)) {
            $payload = $this->emv->payload([
                'merchantName' => (string) ($org['name'] ?? $document->organization?->name ?? 'InvoMind'),
                'merchantCity' => (string) ($org['city'] ?? 'Dakar'),
                'merchantPhone' => (string) $phone,
                'amount' => (string) $computed['total'],
                'currency' => (string) $currency,
                'reference' => (string) ($meta['number'] ?? $document->number),
                'provider' => (string) $provider,
            ]);
            $qrSvg = $this->emv->svg($payload);
            $qrLabel = $this->emv->providerLabel((string) $provider);
        }

        $token = $meta['portal_token'] ?? $document->portal_token;
        $portalUrl = rtrim((string) config('services.frontend.url'), '/').'/f/'.$token;

        return [
            'kind' => $kind,
            'title' => $this->title($kind),
            'number' => $meta['number'] ?? $document->number,
            'currency' => $currency,
            'taxMode' => $taxMode,
            'issueDate' => $this->frenchDate($meta['issue_date'] ?? $document->issue_date),
            'dueDate' => $kind === 'quote' ? null : $this->frenchDate($meta['due_date'] ?? $document->due_date),
            'organization' => $org,
            'client' => $client,
            'branding' => $branding,
            'logoDataUri' => $this->logoDataUri($branding['logo_url'] ?? null),
            'primaryColor' => $branding['primary_color'] ?? '#1F3A2E',
            'lines' => $computed['lines'],
            'showDiscount' => collect($computed['lines'])->contains(fn ($line) => filled($line['discount_percent'] ?? null)),
            'subtotalHt' => Money::format($computed['subtotal_ht'], $currency),
            'taxTotal' => Money::format($computed['tax_total'], $currency),
            'total' => Money::format($computed['total'], $currency),
            'taxByRate' => collect($computed['tax_by_rate'])->mapWithKeys(
                fn (string $amount, string $rate) => [$rate => Money::format($amount, $currency)],
            )->all(),
            'notes' => $meta['notes'] ?? null,
            'qrSvg' => $qrSvg,
            'qrLabel' => $qrLabel,
            'portalUrl' => $portalUrl,
            'computed' => $computed,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function pdfBytes(string $view, array $data): string
    {
        return Pdf::loadView($view, $data)
            ->setPaper('a4', 'portrait')
            ->setOption([
                'defaultFont' => 'DejaVu Sans',
                'isRemoteEnabled' => false,
                'isHtml5ParserEnabled' => true,
            ])
            ->output();
    }

    /**
     * @param  array<string, mixed>  $snapshot
     */
    private function fingerprint(array $snapshot): string
    {
        return hash('sha256', json_encode($snapshot, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    private function path(Document $document): string
    {
        return $document->organization_id.'/'.$document->id.'.pdf';
    }

    private function fingerprintPath(Document $document): string
    {
        return $document->organization_id.'/'.$document->id.'.snapsha';
    }

    private function isFresh(Document $document, string $path, string $fingerprint): bool
    {
        $disk = Storage::disk('documents');

        return filled($document->pdf_sha256)
            && $document->pdf_disk_path === $path
            && $disk->exists($path)
            && $disk->exists($this->fingerprintPath($document))
            && $disk->get($this->fingerprintPath($document)) === $fingerprint;
    }

    private function store(Document $document, string $path, string $fingerprint, string $bytes): void
    {
        $disk = Storage::disk('documents');
        $disk->put($path, $bytes);
        $disk->put($this->fingerprintPath($document), $fingerprint);

        $document->forceFill([
            'pdf_disk_path' => $path,
            'pdf_sha256' => hash('sha256', $bytes),
        ])->save();
    }

    private function assertReady(Document $document): void
    {
        if (! $document->frozen || empty($document->snapshot_json)) {
            throw new DocumentPdfNotReadyException;
        }
    }

    private function title(string $kind): string
    {
        return match ($kind) {
            'credit_note' => 'Avoir',
            'quote' => 'Devis',
            default => 'Facture',
        };
    }

    private function frenchDate(mixed $date): ?string
    {
        if (! $date) {
            return null;
        }

        return Carbon::parse((string) $date)->locale('fr')->translatedFormat('d F Y');
    }

    private function logoDataUri(mixed $url): ?string
    {
        if (! is_string($url) || ! \App\Support\SafeOutboundUrl::isAllowed($url)) {
            return null;
        }

        try {
            $response = Http::timeout(3)
                ->withOptions(['allow_redirects' => false])
                ->get($url);
            if (! $response->successful()) {
                return null;
            }

            $body = $response->body();
            if ($body === '' || strlen($body) > 1_000_000) {
                return null;
            }

            $mime = $response->header('Content-Type') ?: 'image/png';
            $mime = explode(';', $mime)[0];

            if (! str_starts_with($mime, 'image/')) {
                return null;
            }

            return 'data:'.$mime.';base64,'.base64_encode($body);
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function receiptViewData(Payment $payment, Document $document): array
    {
        $snapshot = $document->snapshot_json ?? [];
        $org = $snapshot['organization'] ?? [];
        $currency = $payment->currency ?? $document->currency;

        return [
            'organization' => $org,
            'number' => $document->number,
            'paidAt' => $this->frenchDate($payment->paid_at),
            'amount' => Money::format((string) $payment->amount, $currency),
            'method' => $payment->method,
            'reference' => $payment->reference,
            'clientName' => $payment->client_name ?? $document->client_name,
        ];
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentResource;
use App\Exceptions\DocumentPdfNotReadyException;
use App\Models\Document;
use App\Models\Payment;
use App\Models\PaymentIntent;
use App\Services\DocumentPaymentService;
use App\Services\DocumentPdfService;
use App\Services\PaymentIntentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PortalController extends Controller
{
    public function __construct(
        private DocumentPaymentService $payments,
        private PaymentIntentService $intents,
        private DocumentPdfService $pdfs,
    ) {}

    public function show(string $token): JsonResponse
    {
        $doc = Document::where('portal_token', $token)
            ->with(['lines', 'client', 'organization.settings', 'organization.branding'])
            ->firstOrFail();

        $settings = $doc->organization?->settings;
        $branding = $doc->organization?->branding;

        return response()->json([
            'document' => (new DocumentResource($doc))->resolve(),
            'payments' => Payment::query()
                ->where('document_id', $doc->id)
                ->latest('created_at')
                ->get(['id', 'amount', 'currency', 'method', 'paid_at', 'reference', 'source']),
            'outstanding_balance' => $this->payments->outstandingBalance($doc),
            'payment_status' => $this->paymentStatus($doc),
            'client' => $doc->client ? [
                'name' => $doc->client->name,
                'company' => $doc->client->company,
                'email' => $doc->client->email,
                'phone' => $doc->client->phone,
                'address' => $doc->client->address,
                'city' => $doc->client->city,
                'postal_code' => $doc->client->postal_code,
                'country' => $doc->client->country,
            ] : null,
            'organization' => $doc->organization ? [
                'settings' => $settings ? [
                    'company_name' => $settings->company_name,
                    'email' => $settings->email,
                    'phone' => $settings->phone,
                    'address' => $settings->address,
                    'city' => $settings->city,
                    'postal_code' => $settings->postal_code,
                    'country' => $settings->country,
                    'tax_id' => $settings->tax_id,
                    'bank_name' => $settings->bank_name,
                    'iban' => $settings->iban,
                    'bic' => $settings->bic,
                    'mobile_money_provider' => $settings->mobile_money_provider,
                    'mobile_money_number' => $settings->mobile_money_number,
                    'accepted_payment_methods' => $settings->accepted_payment_methods,
                    'legal_mentions' => $settings->legal_mentions,
                ] : null,
                'branding' => $branding ? [
                    'display_name' => $branding->display_name,
                    'logo_url' => $branding->logo_url,
                    'primary_color' => $branding->primary_color,
                    'accent_color' => $branding->accent_color,
                    'document_template' => $branding->document_template,
                ] : null,
            ] : null,
        ]);
    }

    public function pay(string $token): JsonResponse
    {
        Document::where('portal_token', $token)->firstOrFail();

        return response()->json([
            'message' => 'Le paiement direct du portail est désactivé. Utilisez POST /portal/{token}/checkout.',
        ], 410);
    }

    public function checkout(Request $request, string $token): JsonResponse
    {
        $data = $request->validate([
            'method_hint' => ['sometimes', 'nullable', 'in:wave,orange_money,mtn,moov,card,transfer'],
            'customer_phone' => ['required_if:method_hint,wave,orange_money,mtn,moov', 'nullable', 'string', 'max:32'],
        ]);

        $doc = Document::where('portal_token', $token)->firstOrFail();
        $intent = $this->intents->createForDocument($doc, $data);

        return response()->json([
            'payment_intent' => [
                'id' => $intent->id,
                'status' => $intent->status,
                'checkout_url' => $intent->checkout_url,
                'amount' => $intent->amount,
                'currency' => $intent->currency,
            ],
            'outstanding_balance' => $this->payments->outstandingBalance($doc),
        ], 201);
    }

    public function pdf(string $token): Response
    {
        $doc = Document::where('portal_token', $token)->firstOrFail();

        return $this->pdfs->stream($doc);
    }

    public function receipt(string $token): Response
    {
        $doc = Document::where('portal_token', $token)->firstOrFail();
        $payment = Payment::query()
            ->where('document_id', $doc->id)
            ->latest('created_at')
            ->first();

        if (! $payment instanceof Payment) {
            return response()->json(['message' => 'Aucun reçu disponible pour cette facture.'], 409);
        }

        $payment->setRelation('document', $doc);

        try {
            return $this->pdfs->streamReceipt($payment);
        } catch (DocumentPdfNotReadyException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }
    }

    private function paymentStatus(Document $doc): string
    {
        if ($doc->status === 'paid') {
            return 'paid';
        }

        if ($doc->status === 'partially_paid') {
            return 'partially_paid';
        }

        $open = PaymentIntent::query()
            ->where('document_id', $doc->id)
            ->whereIn('status', [PaymentIntent::STATUS_PENDING, PaymentIntent::STATUS_PROCESSING])
            ->exists();

        if ($open) {
            return 'processing';
        }

        $failed = PaymentIntent::query()
            ->where('document_id', $doc->id)
            ->where('status', PaymentIntent::STATUS_FAILED)
            ->exists();

        return $failed ? 'failed' : 'unpaid';
    }
}

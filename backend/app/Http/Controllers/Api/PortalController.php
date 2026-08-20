<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortalController extends Controller
{
    public function show(string $token): JsonResponse
    {
        $doc = Document::where('portal_token', $token)
            ->with(['lines', 'client', 'organization.settings', 'organization.branding'])
            ->firstOrFail();

        return response()->json([
            'document' => $doc,
            'payments' => Payment::where('document_id', $doc->id)->get(),
            'client' => $doc->client,
            'organization' => $doc->organization ? [
                'settings' => $doc->organization->settings,
                'branding' => $doc->organization->branding,
            ] : null,
        ]);
    }

    public function pay(Request $request, string $token): JsonResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', 'in:card,mobile_money,transfer'],
        ]);

        $doc = Document::where('portal_token', $token)->firstOrFail();

        $payment = Payment::create([
            'organization_id' => $doc->organization_id,
            'document_id' => $doc->id,
            'document_number' => $doc->number,
            'client_id' => $doc->client_id,
            'client_name' => $doc->client_name,
            'amount' => $data['amount'],
            'currency' => $doc->currency,
            'method' => $data['method'],
            'paid_at' => now()->toDateString(),
        ]);

        $totalPaid = Payment::where('document_id', $doc->id)->sum('amount');
        if (bccomp((string) $totalPaid, (string) $doc->total, 2) >= 0) {
            $doc->update(['status' => 'paid', 'paid_online_at' => now()->toIso8601String()]);
        } elseif (bccomp((string) $totalPaid, '0', 2) > 0) {
            $doc->update(['status' => 'partially_paid']);
        }

        return response()->json($payment, 201);
    }
}

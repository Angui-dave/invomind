<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrganizationResource;
use App\Models\Organization;
use App\Services\EntitlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    public function show(Request $request): OrganizationResource
    {
        $org = Organization::with(['subscription.plan', 'subscription.payments'])
            ->findOrFail($this->orgId($request));

        return new OrganizationResource($org);
    }

    public function entitlements(Request $request, EntitlementService $service): JsonResponse
    {
        return response()->json($service->check($this->orgId($request)));
    }

    public function update(Request $request): OrganizationResource
    {
        $org = Organization::query()->findOrFail($this->orgId($request));

        $data = $request->validate([
            'name_company' => ['sometimes', 'string', 'max:255'],
            'full_name' => ['nullable', 'string', 'max:255'],
            'logo_url' => ['nullable', 'string'],
            'email' => ['sometimes', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'ville' => ['nullable', 'string', 'max:100'],
            'code_postal' => ['nullable', 'string', 'max:20'],
            'pays' => ['nullable', 'string', 'max:100'],
            'devise_defaut' => ['nullable', 'string', 'size:3'],
            'parametres' => ['sometimes', 'array'],
            'parametres.default_tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'parametres.default_tax_mode' => ['nullable', 'in:exclusive,inclusive'],
            'parametres.tax_id' => ['nullable', 'string', 'max:64'],
            'parametres.bank_name' => ['nullable', 'string', 'max:255'],
            'parametres.iban' => ['nullable', 'string', 'max:64'],
            'parametres.bic' => ['nullable', 'string', 'max:32'],
            'parametres.qr_iban' => ['nullable', 'string', 'max:64'],
            'parametres.mobile_money_provider' => ['nullable', 'string', 'max:64'],
            'parametres.mobile_money_number' => ['nullable', 'string', 'max:32'],
            'parametres.legal_mentions' => ['nullable', 'string'],
            'parametres.primary_color' => ['nullable', 'string', 'max:16'],
            'parametres.accent_color' => ['nullable', 'string', 'max:16'],
            'parametres.font_family' => ['nullable', 'string', 'max:64'],
            'parametres.document_template' => ['nullable', 'string', 'max:32'],
            'parametres.locale' => ['nullable', 'string', 'max:16'],
            'parametres.reminders_enabled' => ['nullable', 'boolean'],
            'parametres.reminder_cadence' => ['nullable', 'array'],
            'parametres.accepted_payment_methods' => ['nullable', 'array'],
        ]);

        $parametres = array_merge($org->parametres ?? [], $data['parametres'] ?? []);
        unset($data['parametres']);
        $org->update([...$data, 'parametres' => $parametres]);

        return new OrganizationResource($org->fresh(['subscription.plan', 'subscription.payments']));
    }
}

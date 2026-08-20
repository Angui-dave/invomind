<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\BankingSettingsRequest;
use App\Http\Requests\Settings\CompanySettingsRequest;
use App\Http\Requests\Settings\TaxSettingsRequest;
use App\Http\Resources\OrganizationResource;
use App\Models\Organization;
use App\Models\OrganizationBranding;
use App\Models\OrganizationFeatures;
use App\Models\OrganizationSettings;
use App\Services\EntitlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    public function show(Request $request): OrganizationResource
    {
        $org = Organization::with([
            'settings',
            'branding',
            'features',
            'plan',
            'subscription',
            'subscriptionInvoices',
        ])->findOrFail($this->orgId($request));

        return new OrganizationResource($org);
    }

    public function entitlements(Request $request, EntitlementService $service): JsonResponse
    {
        return response()->json($service->check($this->orgId($request)));
    }

    public function updateCompanySettings(CompanySettingsRequest $request): JsonResponse
    {
        $settings = OrganizationSettings::findOrFail($this->orgId($request));
        $settings->update($request->validated());

        return response()->json($settings);
    }

    public function updateTaxSettings(TaxSettingsRequest $request): JsonResponse
    {
        $settings = OrganizationSettings::findOrFail($this->orgId($request));
        $settings->update($request->validated());

        return response()->json($settings);
    }

    public function updateBankingSettings(BankingSettingsRequest $request): JsonResponse
    {
        $settings = OrganizationSettings::findOrFail($this->orgId($request));
        $settings->update($request->validated());

        return response()->json($settings);
    }

    public function updateReminders(Request $request): JsonResponse
    {
        $data = $request->validate([
            'reminders_enabled' => ['required', 'boolean'],
            'reminder_cadence' => ['sometimes', 'array'],
        ]);

        $settings = OrganizationSettings::findOrFail($this->orgId($request));
        $settings->update($data);

        return response()->json($settings);
    }

    public function updatePaymentSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'payment_connected' => ['sometimes', 'boolean'],
            'accepted_payment_methods' => ['sometimes', 'array'],
        ]);

        $settings = OrganizationSettings::findOrFail($this->orgId($request));
        $settings->update($data);

        return response()->json($settings);
    }

    public function updateBranding(Request $request): JsonResponse
    {
        $data = $request->validate([
            'display_name' => ['nullable', 'string'],
            'primary_color' => ['sometimes', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'accent_color' => ['sometimes', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'logo_url' => ['nullable', 'string', 'url'],
            'font_family' => ['sometimes', 'string', 'max:100'],
            'document_template' => ['sometimes', 'in:classic,modern,minimal'],
            'locale' => ['sometimes', 'string', 'max:16'],
            'currency' => ['sometimes', 'string', 'size:3'],
        ]);

        if (! empty($data['logo_url']) && ! \App\Support\SafeOutboundUrl::isAllowed($data['logo_url'])) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'logo_url' => ['Le logo doit être une URL HTTPS vers un hôte public.'],
            ]);
        }

        $branding = OrganizationBranding::findOrFail($this->orgId($request));
        $branding->update($data);

        return response()->json($branding);
    }

    public function updateModules(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pipeline' => ['sometimes', 'boolean'],
            'conversations' => ['sometimes', 'boolean'],
            'expenses' => ['sometimes', 'boolean'],
            'catalog' => ['sometimes', 'boolean'],
            'reports' => ['sometimes', 'boolean'],
            'import_tool' => ['sometimes', 'boolean'],
        ]);

        $features = OrganizationFeatures::findOrFail($this->orgId($request));
        $features->update($data);

        return response()->json($features);
    }
}

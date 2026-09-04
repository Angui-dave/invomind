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
        ]);

        $org->update($data);

        return new OrganizationResource($org->fresh(['subscription.plan']));
    }
}

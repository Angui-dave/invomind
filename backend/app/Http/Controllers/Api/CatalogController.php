<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CatalogItemRequest;
use App\Http\Resources\CatalogItemResource;
use App\Models\CatalogItem;
use App\Services\EntitlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CatalogController extends Controller
{
    public function index(Request $request, EntitlementService $entitlements): AnonymousResourceCollection
    {
        $entitlements->assertModule($this->orgId($request), 'catalog');

        return CatalogItemResource::collection(
            CatalogItem::where('organization_id', $this->orgId($request))
                ->orderBy('created_at', 'desc')
                ->get()
        );
    }

    public function store(CatalogItemRequest $request, EntitlementService $entitlements): JsonResponse
    {
        $entitlements->assertModule($this->orgId($request), 'catalog');

        $item = CatalogItem::create([
            ...$request->validated(),
            'organization_id' => $this->orgId($request),
        ]);

        return (new CatalogItemResource($item))
            ->response()
            ->setStatusCode(201);
    }

    public function update(CatalogItemRequest $request, string $id, EntitlementService $entitlements): CatalogItemResource
    {
        $entitlements->assertModule($this->orgId($request), 'catalog');

        $item = CatalogItem::where('organization_id', $this->orgId($request))->findOrFail($id);
        $item->update($request->validated());

        return new CatalogItemResource($item->fresh());
    }
}

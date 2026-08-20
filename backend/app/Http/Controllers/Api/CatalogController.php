<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CatalogItemRequest;
use App\Models\CatalogItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            CatalogItem::where('organization_id', $this->orgId($request))
                ->orderBy('created_at', 'desc')
                ->get()
        );
    }

    public function store(CatalogItemRequest $request): JsonResponse
    {
        $item = CatalogItem::create([
            ...$request->validated(),
            'organization_id' => $this->orgId($request),
        ]);

        return response()->json($item, 201);
    }

    public function update(CatalogItemRequest $request, string $id): JsonResponse
    {
        $item = CatalogItem::where('organization_id', $this->orgId($request))->findOrFail($id);
        $item->update($request->validated());

        return response()->json($item);
    }
}

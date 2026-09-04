<?php

namespace App\Http\Controllers\Api;

use App\Enums\ProduitType;
use App\Http\Controllers\Controller;
use App\Http\Requests\ProductServiceRequest;
use App\Http\Resources\ProductServiceResource;
use App\Models\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CatalogController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        $query = ProductService::query()->orderBy('name');

        return $this->paginated($request, $query, ProductServiceResource::class);
    }

    public function store(ProductServiceRequest $request): JsonResponse
    {
        $data = $request->validated();
        $type = $data['type'] ?? ProduitType::Produit->value;

        $item = ProductService::create([
            ...$data,
            'orga_id' => $this->orgId($request),
            'user_id' => $request->user()->id,
            'type' => $type,
            'gere_stock' => $data['gere_stock'] ?? ($type !== ProduitType::Service->value && $type !== ProduitType::Service),
        ]);

        return (new ProductServiceResource($item))
            ->response()
            ->setStatusCode(201);
    }

    public function update(ProductServiceRequest $request, int $id): ProductServiceResource
    {
        $item = ProductService::query()->findOrFail($id);
        $item->update($request->validated());

        return new ProductServiceResource($item->fresh());
    }
}

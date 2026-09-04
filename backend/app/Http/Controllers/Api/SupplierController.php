<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SupplierRequest;
use App\Http\Resources\SupplierResource;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SupplierController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        $query = Supplier::query()->orderBy('name_company');

        return $this->paginated($request, $query, SupplierResource::class);
    }

    public function show(Request $request, int $id): SupplierResource
    {
        $supplier = Supplier::query()->findOrFail($id);

        return new SupplierResource($supplier);
    }

    public function store(SupplierRequest $request): JsonResponse
    {
        $data = $request->validated();
        $supplier = Supplier::create([
            ...$data,
            'orga_id' => $this->orgId($request),
            'user_id' => $request->user()->id,
        ]);

        return (new SupplierResource($supplier))
            ->response()
            ->setStatusCode(201);
    }

    public function update(SupplierRequest $request, int $id): SupplierResource
    {
        $supplier = Supplier::query()->findOrFail($id);
        $supplier->update($request->validated());

        return new SupplierResource($supplier->fresh());
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $supplier = Supplier::query()->findOrFail($id);
        $supplier->delete();

        return response()->json(null, 204);
    }
}

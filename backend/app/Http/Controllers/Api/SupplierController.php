<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SupplierRequest;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            Supplier::where('organization_id', $this->orgId($request))
                ->orderBy('created_at', 'desc')
                ->get()
        );
    }

    public function store(SupplierRequest $request): JsonResponse
    {
        $supplier = Supplier::create([
            ...$request->validated(),
            'organization_id' => $this->orgId($request),
        ]);

        return response()->json($supplier, 201);
    }

    public function update(SupplierRequest $request, string $id): JsonResponse
    {
        $supplier = Supplier::where('organization_id', $this->orgId($request))->findOrFail($id);
        $supplier->update($request->validated());

        return response()->json($supplier);
    }
}

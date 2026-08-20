<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Supplier;
use App\Services\EntitlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExpenseController extends Controller
{
    public function index(Request $request, EntitlementService $entitlements): AnonymousResourceCollection
    {
        $entitlements->assertModule($this->orgId($request), 'expenses');

        $expenses = Expense::where('organization_id', $this->orgId($request))
            ->with(['category', 'supplier'])
            ->orderBy('created_at', 'desc')
            ->get();

        return ExpenseResource::collection($expenses);
    }

    public function store(ExpenseRequest $request, EntitlementService $entitlements): JsonResponse
    {
        $entitlements->assertModule($this->orgId($request), 'expenses');

        $data = $request->validated();
        $orgId = $this->orgId($request);

        $supplierName = null;
        if (! empty($data['supplier_id'])) {
            $supplier = Supplier::where('organization_id', $orgId)->findOrFail($data['supplier_id']);
            $supplierName = $supplier->name;
        }

        $taxAmount = bcmul(
            bcdiv((string) ($data['tax_rate'] ?? 0), '100', 4),
            (string) $data['amount'],
            2
        );

        $expense = Expense::create([
            ...$data,
            'organization_id' => $orgId,
            'supplier_name' => $supplierName,
            'tax_amount' => $taxAmount,
        ]);

        return (new ExpenseResource($expense->load(['category', 'supplier'])))
            ->response()
            ->setStatusCode(201);
    }

    public function update(ExpenseRequest $request, string $id, EntitlementService $entitlements): ExpenseResource
    {
        $entitlements->assertModule($this->orgId($request), 'expenses');

        $data = $request->validated();
        $orgId = $this->orgId($request);

        $expense = Expense::where('organization_id', $orgId)->findOrFail($id);

        $supplierName = $expense->supplier_name;
        if (array_key_exists('supplier_id', $data) && $data['supplier_id']) {
            $supplier = Supplier::where('organization_id', $orgId)->findOrFail($data['supplier_id']);
            $supplierName = $supplier->name;
        }

        $taxAmount = bcmul(
            bcdiv((string) ($data['tax_rate'] ?? $expense->tax_rate), '100', 4),
            (string) ($data['amount'] ?? $expense->amount),
            2
        );

        $expense->update([
            ...$data,
            'supplier_name' => $supplierName,
            'tax_amount' => $taxAmount,
        ]);

        return new ExpenseResource($expense->fresh()->load(['category', 'supplier']));
    }

    public function categories(Request $request, EntitlementService $entitlements): JsonResponse
    {
        $entitlements->assertModule($this->orgId($request), 'expenses');

        $categories = ExpenseCategory::where('organization_id', $this->orgId($request))->get();

        return response()->json($categories);
    }
}

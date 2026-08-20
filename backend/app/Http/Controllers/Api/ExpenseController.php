<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExpenseRequest;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $expenses = Expense::where('organization_id', $this->orgId($request))
            ->with(['category', 'supplier'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($expenses);
    }

    public function store(ExpenseRequest $request): JsonResponse
    {
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

        return response()->json($expense->load(['category', 'supplier']), 201);
    }

    public function update(ExpenseRequest $request, string $id): JsonResponse
    {
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

        return response()->json($expense->load(['category', 'supplier']));
    }

    public function categories(Request $request): JsonResponse
    {
        $categories = ExpenseCategory::where('organization_id', $this->orgId($request))->get();

        return response()->json($categories);
    }
}

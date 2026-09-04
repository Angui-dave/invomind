<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExpenseCategoryRequest;
use App\Http\Resources\ExpenseCategoryResource;
use App\Models\ExpenseCategory;
use App\Services\EntitlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExpenseCategoryController extends Controller
{
    public function index(Request $request, EntitlementService $entitlements): AnonymousResourceCollection|JsonResponse
    {
        $entitlements->assertModule($this->orgId($request), 'expenses');

        $includeInactive = filter_var(
            $request->query('include_inactive', false),
            FILTER_VALIDATE_BOOLEAN,
        );

        $query = ExpenseCategory::query()->orderBy('nom');

        if (! $includeInactive) {
            $query->where('actif', true);
        } else {
            // Globals only if active; org categories include inactive for management UI.
            $query->where(function ($q) {
                $q->whereNotNull('orga_id')
                    ->orWhere(function ($q2) {
                        $q2->whereNull('orga_id')->where('actif', true);
                    });
            });
        }

        return $this->paginated($request, $query, ExpenseCategoryResource::class);
    }

    public function store(ExpenseCategoryRequest $request, EntitlementService $entitlements): JsonResponse
    {
        $entitlements->assertModule($this->orgId($request), 'expenses');

        $data = $request->validated();
        $category = ExpenseCategory::create([
            ...$data,
            'orga_id' => $this->orgId($request),
            'actif' => $data['actif'] ?? true,
        ]);

        return (new ExpenseCategoryResource($category))
            ->response()
            ->setStatusCode(201);
    }

    public function update(ExpenseCategoryRequest $request, int $id, EntitlementService $entitlements): ExpenseCategoryResource
    {
        $entitlements->assertModule($this->orgId($request), 'expenses');

        $category = ExpenseCategory::query()->findOrFail($id);

        if ($category->orga_id === null) {
            abort(403, 'Les catégories globales ne peuvent pas être modifiées.');
        }

        $category->update($request->validated());

        return new ExpenseCategoryResource($category->fresh());
    }

    public function destroy(Request $request, int $id, EntitlementService $entitlements): JsonResponse
    {
        $entitlements->assertModule($this->orgId($request), 'expenses');

        $category = ExpenseCategory::query()->findOrFail($id);

        if ($category->orga_id === null) {
            abort(403, 'Les catégories globales ne peuvent pas être supprimées.');
        }

        $category->update(['actif' => false]);

        return response()->json(null, 204);
    }
}

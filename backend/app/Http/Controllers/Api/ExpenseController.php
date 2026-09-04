<?php

namespace App\Http\Controllers\Api;

use App\Enums\DepenseStatut;
use App\Http\Controllers\Controller;
use App\Http\Requests\ExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Models\Supplier;
use App\Services\EntitlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExpenseController extends Controller
{
    public function index(Request $request, EntitlementService $entitlements): AnonymousResourceCollection|JsonResponse
    {
        $entitlements->assertModule($this->orgId($request), 'expenses');

        $query = Expense::query()
            ->with(['category', 'supplier'])
            ->orderByDesc('date_depense');

        return $this->paginated($request, $query, ExpenseResource::class);
    }

    public function show(Request $request, int $id, EntitlementService $entitlements): ExpenseResource
    {
        $entitlements->assertModule($this->orgId($request), 'expenses');

        $expense = Expense::query()
            ->with(['category', 'supplier'])
            ->findOrFail($id);

        return new ExpenseResource($expense);
    }

    public function store(ExpenseRequest $request, EntitlementService $entitlements): JsonResponse
    {
        $entitlements->assertModule($this->orgId($request), 'expenses');

        $data = $request->validated();
        $data = $this->resolveSupplierLabel($data);

        $taux = (float) ($data['taux_tva'] ?? 0);
        $ht = (float) $data['montant_ht'];
        $montantTva = round($ht * ($taux / 100), 2);

        $expense = Expense::create([
            ...$data,
            'orga_id' => $this->orgId($request),
            'user_id' => $request->user()->id,
            'montant_tva' => $montantTva,
            'date_depense' => $data['date_depense'] ?? now()->toDateString(),
            'statut' => $data['statut'] ?? DepenseStatut::Validee,
            'recurrente' => $data['recurrente'] ?? false,
        ]);

        return (new ExpenseResource($expense->load(['category', 'supplier'])))
            ->response()
            ->setStatusCode(201);
    }

    public function update(ExpenseRequest $request, int $id, EntitlementService $entitlements): ExpenseResource
    {
        $entitlements->assertModule($this->orgId($request), 'expenses');

        $expense = Expense::query()->findOrFail($id);
        $data = $this->resolveSupplierLabel($request->validated());

        if (isset($data['montant_ht']) || isset($data['taux_tva'])) {
            $ht = (float) ($data['montant_ht'] ?? $expense->montant_ht);
            $taux = (float) ($data['taux_tva'] ?? $expense->taux_tva);
            $data['montant_tva'] = round($ht * ($taux / 100), 2);
        }

        $expense->update($data);

        return new ExpenseResource($expense->fresh()->load(['category', 'supplier']));
    }

    public function destroy(Request $request, int $id, EntitlementService $entitlements): JsonResponse
    {
        $entitlements->assertModule($this->orgId($request), 'expenses');

        $expense = Expense::query()->findOrFail($id);
        $expense->delete();

        return response()->json(null, 204);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function resolveSupplierLabel(array $data): array
    {
        if (! empty($data['fournisseur_id'])) {
            $supplier = Supplier::query()->find($data['fournisseur_id']);
            if ($supplier) {
                $data['fournisseur'] = $supplier->name_company;
            }
        }

        return $data;
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CatalogItem;
use App\Models\Client;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Supplier;
use App\Services\EntitlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ImportController extends Controller
{
    public function import(Request $request, string $entity, EntitlementService $entitlements): JsonResponse
    {
        $entitlements->assertModule($this->orgId($request), 'import_tool');

        $data = $request->validate([
            'rows' => ['required', 'array', 'min:1', 'max:500'],
            'rows.*' => ['required', 'array'],
        ]);

        if (! in_array($entity, ['clients', 'suppliers', 'catalog', 'expenses'], true)) {
            return response()->json(['message' => "Unknown entity: $entity"], 422);
        }

        $orgId = $this->orgId($request);
        $imported = 0;
        $errors = [];

        foreach ($data['rows'] as $i => $row) {
            try {
                match ($entity) {
                    'clients' => $this->importClient($orgId, $row),
                    'suppliers' => $this->importSupplier($orgId, $row),
                    'catalog' => $this->importCatalog($orgId, $row),
                    'expenses' => $this->importExpense($orgId, $row),
                };
                $imported++;
            } catch (\Throwable $e) {
                $errors[] = ['row' => $i, 'error' => $e->getMessage()];
            }
        }

        return response()->json([
            'imported' => $imported,
            'errors' => $errors,
        ]);
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function importClient(string $orgId, array $row): void
    {
        app(EntitlementService::class)->assertCanCreateClient($orgId);

        $name = $this->str($row, 'name');
        $email = $this->str($row, 'email');
        if ($name === '' || $email === '') {
            throw new \InvalidArgumentException('name and email are required');
        }

        Client::create([
            'organization_id' => $orgId,
            'name' => $name,
            'company' => $this->str($row, 'company'),
            'email' => $email,
            'phone' => $this->nullableStr($row, 'phone'),
            'city' => $this->nullableStr($row, 'city'),
            'country' => $this->nullableStr($row, 'country'),
            'reminders_enabled' => true,
            'portal_token' => Str::random(32),
        ]);
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function importSupplier(string $orgId, array $row): void
    {
        $name = $this->str($row, 'name');
        if ($name === '') {
            throw new \InvalidArgumentException('name is required');
        }

        Supplier::create([
            'organization_id' => $orgId,
            'name' => $name,
            'company' => $this->str($row, 'company'),
            'email' => $this->str($row, 'email'),
            'phone' => $this->nullableStr($row, 'phone'),
            'city' => $this->nullableStr($row, 'city'),
            'country' => $this->nullableStr($row, 'country'),
        ]);
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function importCatalog(string $orgId, array $row): void
    {
        $name = $this->str($row, 'name');
        if ($name === '') {
            throw new \InvalidArgumentException('name is required');
        }

        $unitPrice = $this->num($row, 'unit_price', $this->num($row, 'unitPrice'));
        $taxRate = $this->num($row, 'tax_rate', $this->num($row, 'taxRate'));

        CatalogItem::create([
            'organization_id' => $orgId,
            'name' => $name,
            'description' => $this->str($row, 'description'),
            'unit_price' => $unitPrice,
            'tax_rate' => $taxRate,
            'unit' => $this->str($row, 'unit', 'unité') ?: 'unité',
            'kind' => $this->str($row, 'kind', 'service') ?: 'service',
            'currency' => $this->str($row, 'currency', 'XOF') ?: 'XOF',
        ]);
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function importExpense(string $orgId, array $row): void
    {
        $description = $this->str($row, 'description');
        $amount = $this->num($row, 'amount');
        if ($description === '' || $amount <= 0) {
            throw new \InvalidArgumentException('description and positive amount are required');
        }

        $categoryName = $this->str($row, 'category', 'Autres') ?: 'Autres';
        $category = ExpenseCategory::query()
            ->where('organization_id', $orgId)
            ->whereRaw('lower(name) = ?', [mb_strtolower($categoryName)])
            ->first();

        if (! $category) {
            $category = ExpenseCategory::create([
                'organization_id' => $orgId,
                'name' => $categoryName,
                'color' => '#888888',
            ]);
        }

        $date = $this->str($row, 'date');
        if ($date === '' || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            $date = now()->toDateString();
        }

        Expense::create([
            'organization_id' => $orgId,
            'date' => $date,
            'description' => $description,
            'amount' => $amount,
            'currency' => $this->str($row, 'currency', 'XOF') ?: 'XOF',
            'category_id' => $category->id,
            'supplier_name' => $this->nullableStr($row, 'supplier')
                ?? $this->nullableStr($row, 'supplier_name'),
            'tax_rate' => 0,
            'tax_deductible' => true,
            'tax_amount' => 0,
        ]);
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function str(array $row, string $key, string $default = ''): string
    {
        $value = $row[$key] ?? null;

        return is_string($value) || is_numeric($value) ? trim((string) $value) : $default;
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function nullableStr(array $row, string $key): ?string
    {
        $value = $this->str($row, $key);

        return $value === '' ? null : $value;
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function num(array $row, string $key, float $default = 0): float
    {
        $value = $row[$key] ?? null;
        if ($value === null || $value === '') {
            return $default;
        }
        $n = is_numeric($value) ? (float) $value : (float) str_replace(',', '.', (string) $value);

        return is_finite($n) ? $n : $default;
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CatalogItem;
use App\Models\Client;
use App\Models\Expense;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ImportController extends Controller
{
    public function import(Request $request, string $entity): JsonResponse
    {
        $data = $request->validate([
            'rows' => ['required', 'array', 'min:1'],
            'rows.*' => ['required', 'array'],
        ]);

        $orgId = $this->orgId($request);
        $imported = 0;
        $errors = [];

        foreach ($data['rows'] as $i => $row) {
            try {
                match ($entity) {
                    'clients' => Client::create([...$row, 'organization_id' => $orgId, 'portal_token' => Str::random(32)]),
                    'suppliers' => Supplier::create([...$row, 'organization_id' => $orgId]),
                    'catalog' => CatalogItem::create([...$row, 'organization_id' => $orgId]),
                    default => throw new \InvalidArgumentException("Unknown entity: $entity"),
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
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Placeholder controller for the Agents module.
 * The agent service is currently mock-only on the frontend.
 * Implement actual agent logic when the feature is ready.
 */
class AgentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string'],
            'type' => ['required', 'string'],
            'config' => ['sometimes', 'array'],
        ]);

        return response()->json([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => $data['name'],
            'type' => $data['type'],
            'enabled' => true,
            'config' => $data['config'] ?? [],
        ], 201);
    }

    public function enable(Request $request, string $id): JsonResponse
    {
        return response()->json(['id' => $id, 'enabled' => true]);
    }

    public function disable(Request $request, string $id): JsonResponse
    {
        return response()->json(['id' => $id, 'enabled' => false]);
    }
}

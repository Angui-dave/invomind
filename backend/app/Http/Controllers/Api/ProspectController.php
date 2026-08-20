<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProspectRequest;
use App\Models\Prospect;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProspectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $prospects = Prospect::where('organization_id', $this->orgId($request))
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($prospects);
    }

    public function store(ProspectRequest $request): JsonResponse
    {
        $prospect = Prospect::create([
            ...$request->validated(),
            'organization_id' => $this->orgId($request),
            'last_interaction_at' => now()->toDateString(),
        ]);

        return response()->json($prospect, 201);
    }

    public function updateStage(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'stage' => ['required', 'in:nouveau,qualifie,devis,negociation,gagne,perdu'],
        ]);

        $prospect = Prospect::where('organization_id', $this->orgId($request))->findOrFail($id);
        $prospect->update([
            'stage' => $data['stage'],
            'last_interaction_at' => now()->toDateString(),
        ]);

        return response()->json($prospect);
    }
}

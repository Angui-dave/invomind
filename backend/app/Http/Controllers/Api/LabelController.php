<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LabelRequest;
use App\Http\Resources\LabelResource;
use App\Models\Label;
use App\Services\EntitlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LabelController extends Controller
{
    public function __construct(private EntitlementService $entitlements) {}

    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        $query = Label::query()->orderBy('nom');

        return $this->paginated($request, $query, LabelResource::class);
    }

    public function store(LabelRequest $request): LabelResource
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        $label = Label::query()->create([
            'nom' => $request->input('nom'),
            'couleur' => $request->input('couleur', '#64748b'),
        ]);

        return new LabelResource($label);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->entitlements->assertModule($this->orgId($request), 'conversations');

        Label::query()->findOrFail($id)->delete();

        return response()->json(['ok' => true]);
    }
}

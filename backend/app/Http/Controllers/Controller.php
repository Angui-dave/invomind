<?php

namespace App\Http\Controllers;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;

abstract class Controller
{
    use AuthorizesRequests;

    protected function orgId(Request $request): string
    {
        return $request->attributes->get('organization_id');
    }

    /**
     * Optional pagination: omit per_page to keep a bare collection (current contract).
     * With per_page (1–100), returns `{ data, meta }`.
     *
     * @param  class-string<JsonResource>|null  $resource
     */
    protected function paginated(
        Request $request,
        Builder $query,
        ?string $resource = null,
    ): AnonymousResourceCollection|JsonResponse {
        $perPage = (int) $request->query('per_page', 0);
        if ($perPage <= 0) {
            $items = $query->get();

            return $resource
                ? $resource::collection($items)
                : response()->json($items);
        }

        $perPage = min(max($perPage, 1), 100);
        $page = max(1, (int) $request->query('page', 1));
        $paginator = $query->paginate($perPage, ['*'], 'page', $page);
        $data = $resource
            ? $resource::collection($paginator->getCollection())->resolve()
            : $paginator->items();

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }
}


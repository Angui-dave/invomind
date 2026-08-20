<?php

namespace App\Http\Middleware;

use App\Models\Membership;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $organizationId = $request->header('X-Organization-Id');

        if (! $organizationId) {
            $membership = Membership::where('user_id', $user->id)->first();
            $organizationId = $membership?->organization_id;
        }

        if (! $organizationId) {
            return response()->json(['message' => 'No organization context.'], 403);
        }

        $membership = Membership::where('user_id', $user->id)
            ->where('organization_id', $organizationId)
            ->first();

        if (! $membership) {
            return response()->json(['message' => 'Not a member of this organization.'], 403);
        }

        if ($membership->isDisabled()) {
            return response()->json(['message' => 'Ce compte a été désactivé.'], 403);
        }

        $request->attributes->set('organization_id', $organizationId);
        $request->attributes->set('membership', $membership);
        $request->attributes->set('membership_role', $membership->role);

        return $next($request);
    }
}
